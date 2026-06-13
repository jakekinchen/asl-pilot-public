export function installChatGPTProPolling({ tab, nodeRepl }) {
  if (!tab) {
    throw new Error("installChatGPTProPolling requires the browser tab binding.");
  }

  globalThis.extractLatestChatGPTAnswer = async function extractLatestChatGPTAnswer() {
    const snapshot = await tab.playwright.domSnapshot();
    const headingMarkers = [
      '- heading "ChatGPT said:" [level=4]',
      '- heading [level=4]: "ChatGPT said:"',
    ];
    const starts = headingMarkers
      .map((marker) => {
        const index = snapshot.lastIndexOf(marker);
        return index >= 0 ? { index, marker } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.index - a.index);
    const startMatch = starts[0];
    if (!startMatch) {
      return { found: false, text: "", chars: 0, url: await tab.url() };
    }

    const afterHeading = snapshot.slice(startMatch.index + startMatch.marker.length);
    const endMarkers = [
      '\n  - group "Response actions":',
      '\n  - button "Add files and more"',
      "\n- alert",
    ];
    const end = endMarkers
      .map((marker) => afterHeading.indexOf(marker))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0] ?? afterHeading.length;
    const raw = afterHeading.slice(0, end);
    const text = raw
      .split("\n")
      .map((line) => line
        .replace(/^\s*-\s*/, "")
        .replace(/^generic:\s*/, "")
        .replace(/^paragraph:\s*/, "")
        .replace(/^text:\s*/, "")
        .replace(/^strong:\s*/, "**")
        .replace(/^code:\s*/, "`")
        .replace(/^heading\s+/, "# ")
        .replace(/^'heading\s+/, "# ")
        .replace(/'$/, "")
        .trim())
      .filter((line) => line && !/^button/.test(line))
      .join("\n")
      .replace(/`\n/g, "`\n")
      .replace(/\*\*\n/g, "**\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return { found: true, text, chars: text.length, url: await tab.url() };
  };

  globalThis.chatgptResponseState = async function chatgptResponseState() {
    const isStreaming = (await tab.playwright.getByRole("button", { name: "Stop streaming" }).count()) > 0;
    const answer = await globalThis.extractLatestChatGPTAnswer();
    const excerpt = answer.text.length > 6000 ? answer.text.slice(-6000) : answer.text;
    const hash = [...excerpt]
      .reduce((acc, ch) => ((acc * 31 + ch.charCodeAt(0)) >>> 0), 0)
      .toString(16);
    return {
      isStreaming,
      hash,
      excerpt,
      answerChars: answer.chars,
      answerFound: answer.found,
      url: answer.url,
    };
  };

  globalThis.chatgptLongPollConfig = {
    intervalMs: 30_000,
    totalMs: 30 * 60_000,
    startedAt: null,
    observations: [],
  };

  globalThis.resetChatGPTLongPoll = function resetChatGPTLongPoll() {
    globalThis.chatgptLongPollConfig.startedAt = Date.now();
    globalThis.chatgptLongPollConfig.observations = [];
    return globalThis.chatgptLongPollConfig;
  };

  globalThis.pollChatGPT30mChunk = async function pollChatGPT30mChunk({ pollsPerChunk = 3 } = {}) {
    if (!globalThis.chatgptLongPollConfig.startedAt) {
      globalThis.resetChatGPTLongPoll();
    }

    let previous = await globalThis.chatgptResponseState();
    for (let i = 0; i < pollsPerChunk; i += 1) {
      const elapsedBefore = Date.now() - globalThis.chatgptLongPollConfig.startedAt;
      if (elapsedBefore >= globalThis.chatgptLongPollConfig.totalMs) {
        return {
          done: true,
          reason: "30m elapsed",
          elapsedMs: elapsedBefore,
          observations: globalThis.chatgptLongPollConfig.observations,
          latest: previous,
        };
      }
      if (!previous.isStreaming) {
        return {
          done: true,
          reason: "not streaming",
          elapsedMs: elapsedBefore,
          observations: globalThis.chatgptLongPollConfig.observations,
          latest: previous,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, globalThis.chatgptLongPollConfig.intervalMs));
      const current = await globalThis.chatgptResponseState();
      const observation = {
        poll: globalThis.chatgptLongPollConfig.observations.length + 1,
        elapsedMs: Date.now() - globalThis.chatgptLongPollConfig.startedAt,
        isStreaming: current.isStreaming,
        changed: current.hash !== previous.hash,
        hash: current.hash,
        excerptChars: current.excerpt.length,
      };
      globalThis.chatgptLongPollConfig.observations.push(observation);
      previous = current;

      if (!current.isStreaming) {
        return {
          done: true,
          reason: "completed",
          elapsedMs: observation.elapsedMs,
          observations: globalThis.chatgptLongPollConfig.observations,
          latest: current,
        };
      }
    }

    return {
      done: false,
      reason: "chunk complete",
      elapsedMs: Date.now() - globalThis.chatgptLongPollConfig.startedAt,
      observations: globalThis.chatgptLongPollConfig.observations,
      latest: previous,
    };
  };

  nodeRepl?.write?.("Installed ChatGPT Pro polling helpers.");
  return {
    extractLatestChatGPTAnswer: globalThis.extractLatestChatGPTAnswer,
    chatgptResponseState: globalThis.chatgptResponseState,
    resetChatGPTLongPoll: globalThis.resetChatGPTLongPoll,
    pollChatGPT30mChunk: globalThis.pollChatGPT30mChunk,
  };
}
