#!/usr/bin/env python3
"""Audit the local open-source ML environment for ASL pilot decode/train/export."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import importlib.metadata
import importlib.util
import json
import platform
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-local-ml-environment/v1"
DEFAULT_REPORT_PATH = PROJECT_ROOT / "docs" / "validation" / "local-ml-environment.json"
GIB = 1024 ** 3
MIN_STORAGE_AVAILABLE_BYTES = 40 * GIB
RECOMMENDED_STORAGE_AVAILABLE_BYTES = 100 * GIB
MIN_MEMORY_BYTES = 32 * GIB
MIN_LOGICAL_CPU_CORES = 8
MIN_APPLE_GPU_CORES = 16
REQUIRED_PYTHON_PACKAGES = {
    "torch": "2.12.0",
    "onnx": "1.21.0",
    "onnxscript": "0.7.0",
}
REQUIRED_PYTHON_PACKAGE_PROVENANCE = {
    "torch": {
        "license": "BSD-3-Clause",
        "source_url": "https://github.com/pytorch/pytorch",
    },
    "onnx": {
        "license": "Apache-2.0",
        "source_url": "https://github.com/onnx/onnx",
    },
    "onnxscript": {
        "license": "MIT",
        "source_url": "https://github.com/microsoft/onnxscript",
    },
}
REQUIRED_PROJECT_FILES = (
    Path("requirements.txt"),
    Path("web/package.json"),
    Path("web/package-lock.json"),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Audit the local open-source ML/GPU stack and optionally verify or "
            "write the retained receipt required by final decode/train/eval/export."
        )
    )
    parser.add_argument(
        "--report",
        type=Path,
        help=(
            "Retained report to verify against the current environment. "
            "Usually docs/validation/local-ml-environment.json."
        ),
    )
    parser.add_argument(
        "--write-report",
        nargs="?",
        const=DEFAULT_REPORT_PATH,
        type=Path,
        help=(
            "Write the current environment report. When no path is provided, "
            "writes docs/validation/local-ml-environment.json."
        ),
    )
    return parser.parse_args()


def package_version(name: str) -> str | None:
    try:
        return importlib.metadata.version(name)
    except importlib.metadata.PackageNotFoundError:
        return None


def package_metadata(name: str) -> importlib.metadata.PackageMetadata | None:
    try:
        return importlib.metadata.metadata(name)
    except importlib.metadata.PackageNotFoundError:
        return None


def project_url(metadata: importlib.metadata.PackageMetadata, label: str) -> str | None:
    prefix = f"{label},"
    for item in metadata.get_all("Project-URL") or []:
        if item.startswith(prefix):
            return item.split(",", 1)[1].strip()
    return None


def normalized_license(metadata: importlib.metadata.PackageMetadata, expected: str) -> str | None:
    expression = metadata.get("License-Expression")
    if expression:
        return expression
    license_text = metadata.get("License") or ""
    if expected == "MIT" and "MIT" in license_text:
        return "MIT"
    if expected == "BSD-3-Clause" and "BSD-3-Clause" in license_text:
        return "BSD-3-Clause"
    if expected == "Apache-2.0" and "Apache" in license_text:
        return "Apache-2.0"
    for classifier in metadata.get_all("Classifier") or []:
        if expected == "MIT" and classifier.endswith("MIT License"):
            return "MIT"
        if expected == "Apache-2.0" and "Apache Software License" in classifier:
            return "Apache-2.0"
        if expected == "BSD-3-Clause" and "BSD License" in classifier:
            return "BSD-3-Clause"
    return license_text.strip() or None


def package_provenance(name: str, expected_version: str, findings: list[str]) -> dict[str, Any]:
    installed = package_version(name)
    expected = REQUIRED_PYTHON_PACKAGE_PROVENANCE[name]
    metadata = package_metadata(name)
    license_value = normalized_license(metadata, expected["license"]) if metadata else None
    source_url = project_url(metadata, "Repository") if metadata else None
    record = {
        "expected": expected_version,
        "installed": installed,
        "matches_expected": installed == expected_version,
        "metadata_available": metadata is not None,
        "expected_license": expected["license"],
        "license_matches_expected": license_value == expected["license"],
        "expected_source_url": expected["source_url"],
        "source_url_matches_expected": source_url == expected["source_url"],
        "metadata": {
            "license": license_value,
            "source_url": source_url,
            "summary": metadata.get("Summary") if metadata else None,
        },
    }
    if installed != expected_version:
        findings.append(f"{name} must be installed at {expected_version}; found {installed or 'missing'}")
    if metadata is None:
        findings.append(f"{name} package metadata must be available for final open-source provenance")
    if license_value != expected["license"]:
        findings.append(f"{name} package license must be {expected['license']}; found {license_value or 'missing'}")
    if source_url != expected["source_url"]:
        findings.append(f"{name} package repository URL must be {expected['source_url']}; found {source_url or 'missing'}")
    return record


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def resolve_project_path(path: Path) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    resolved.relative_to(PROJECT_ROOT)
    return resolved


def file_reference(path: Path) -> dict[str, str]:
    resolved = path.resolve()
    return {
        "path": project_relative(resolved),
        "sha256": sha256_file(resolved),
    }


def external_file_reference(path: str | None) -> dict[str, Any]:
    if not path:
        return {"path": None, "sha256": None}
    resolved = Path(path).resolve()
    if not resolved.exists() or not resolved.is_file():
        return {"path": str(resolved), "sha256": None}
    return {
        "path": str(resolved),
        "sha256": sha256_file(resolved),
    }


def project_file_references(findings: list[str]) -> list[dict[str, str]]:
    references: list[dict[str, str]] = []
    for relative_path in REQUIRED_PROJECT_FILES:
        resolved = PROJECT_ROOT / relative_path
        if not resolved.exists():
            findings.append(f"{relative_path.as_posix()} must exist for final environment evidence")
            continue
        references.append(file_reference(resolved))
    return references


def storage_headroom_info(findings: list[str]) -> dict[str, Any]:
    usage = shutil.disk_usage(PROJECT_ROOT)
    available_gib = usage.free / GIB
    minimum_passed = usage.free >= MIN_STORAGE_AVAILABLE_BYTES
    recommended_passed = usage.free >= RECOMMENDED_STORAGE_AVAILABLE_BYTES
    if not minimum_passed:
        findings.append(
            "Local data volume must have at least "
            f"{MIN_STORAGE_AVAILABLE_BYTES // GIB} GiB available before final collection/training; "
            f"found {available_gib:.1f} GiB"
        )
    return {
        "path": ".",
        "purpose": (
            "pre-collection raw video, decoded tensor, training, evaluation, "
            "and ONNX artifact headroom"
        ),
        "total_bytes": usage.total,
        "used_bytes": usage.used,
        "available_bytes": usage.free,
        "total_gib": round(usage.total / GIB, 1),
        "used_gib": round(usage.used / GIB, 1),
        "available_gib": round(available_gib, 1),
        "minimum_available_gib": MIN_STORAGE_AVAILABLE_BYTES // GIB,
        "recommended_available_gib": RECOMMENDED_STORAGE_AVAILABLE_BYTES // GIB,
        "minimum_passed": minimum_passed,
        "recommended_passed": recommended_passed,
        "operational_warning": None
        if recommended_passed
        else (
            "Available local storage is below the recommended 100 GiB pre-collection/training "
            "headroom; clean up or move non-project data before large collection runs."
        ),
    }


def command_output(command: list[str]) -> dict[str, Any]:
    result = subprocess.run(
        command,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return {
        "command": command,
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }


def sysctl_value(name: str) -> str | None:
    result = command_output(["sysctl", "-n", name])
    if result["returncode"] != 0:
        return None
    value = result["stdout"].strip()
    return value or None


def sysctl_int(name: str) -> int | None:
    value = sysctl_value(name)
    if value is None:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def first_match(text: str, pattern: str) -> str | None:
    match = re.search(pattern, text, flags=re.MULTILINE)
    return match.group(1).strip() if match else None


def hardware_resources_info(findings: list[str]) -> dict[str, Any]:
    profiler = command_output(["system_profiler", "SPHardwareDataType", "SPDisplaysDataType"])
    profiler_text = profiler["stdout"] if profiler["returncode"] == 0 else ""
    graphics_text = profiler_text.split("Graphics/Displays:", 1)[1] if "Graphics/Displays:" in profiler_text else ""
    cpu_brand = sysctl_value("machdep.cpu.brand_string")
    logical_cpu_cores = sysctl_int("hw.logicalcpu")
    physical_cpu_cores = sysctl_int("hw.physicalcpu")
    memory_bytes = sysctl_int("hw.memsize")
    chip = first_match(profiler_text, r"^\s*Chip:\s*(.+)$") or cpu_brand
    gpu_cores_text = first_match(graphics_text, r"^\s*Total Number of Cores:\s*(\d+).*$")
    gpu_core_count = int(gpu_cores_text) if gpu_cores_text else None
    apple_silicon = platform.machine() == "arm64" and "Apple" in str(chip or cpu_brand or "")
    memory_passed = memory_bytes is not None and memory_bytes >= MIN_MEMORY_BYTES
    cpu_passed = logical_cpu_cores is not None and logical_cpu_cores >= MIN_LOGICAL_CPU_CORES
    gpu_passed = gpu_core_count is not None and gpu_core_count >= MIN_APPLE_GPU_CORES
    if profiler["returncode"] != 0:
        findings.append("system_profiler must expose sanitized hardware and GPU resource evidence")
    if not apple_silicon:
        findings.append("Local hardware must be Apple Silicon for the intended MPS training/export path")
    if not cpu_passed:
        findings.append(
            f"Local hardware must expose at least {MIN_LOGICAL_CPU_CORES} logical CPU cores; "
            f"found {logical_cpu_cores if logical_cpu_cores is not None else 'missing'}"
        )
    if not memory_passed:
        findings.append(
            f"Local hardware must expose at least {MIN_MEMORY_BYTES // GIB} GiB memory; "
            f"found {round(memory_bytes / GIB, 1) if memory_bytes is not None else 'missing'}"
        )
    if not gpu_passed:
        findings.append(
            f"Local hardware must expose at least {MIN_APPLE_GPU_CORES} Apple GPU cores; "
            f"found {gpu_core_count if gpu_core_count is not None else 'missing'}"
        )
    return {
        "purpose": "sanitized local hardware resources for Apple Silicon MPS raw-frame training and export",
        "model_name": first_match(profiler_text, r"^\s*Model Name:\s*(.+)$"),
        "model_identifier": first_match(profiler_text, r"^\s*Model Identifier:\s*(.+)$"),
        "chip": chip,
        "cpu_brand": cpu_brand,
        "cpu_physical_cores": physical_cpu_cores,
        "cpu_logical_cores": logical_cpu_cores,
        "memory_bytes": memory_bytes,
        "memory_gib": round(memory_bytes / GIB, 1) if memory_bytes is not None else None,
        "gpu": {
            "chipset_model": first_match(graphics_text, r"^\s*Chipset Model:\s*(.+)$"),
            "core_count": gpu_core_count,
            "metal_support": first_match(graphics_text, r"^\s*Metal Support:\s*(.+)$"),
        },
        "apple_silicon": apple_silicon,
        "minimum_memory_gib": MIN_MEMORY_BYTES // GIB,
        "minimum_logical_cpu_cores": MIN_LOGICAL_CPU_CORES,
        "minimum_apple_gpu_cores": MIN_APPLE_GPU_CORES,
        "minimums_passed": bool(memory_passed and cpu_passed and gpu_passed and apple_silicon),
        "system_profiler": {
            "command": profiler["command"],
            "returncode": profiler["returncode"],
            "sanitized": True,
            "excluded_fields": [
                "serial_number",
                "hardware_uuid",
                "provisioning_udid",
            ],
        },
    }


def command_version(command: list[str]) -> dict[str, Any]:
    result = command_output(command)
    first_line = ""
    for stream in (result["stdout"], result["stderr"]):
        if stream.strip():
            first_line = stream.splitlines()[0]
            break
    return {
        "command": command,
        "available": result["returncode"] == 0,
        "version": first_line,
        "returncode": result["returncode"],
    }


def ffmpeg_info() -> dict[str, Any]:
    executable = shutil.which("ffmpeg")
    if not executable:
        return {"available": False, "path": None, "version": None, "binary": external_file_reference(None)}
    version = command_version([executable, "-version"])
    return {
        "available": version["available"],
        "path": executable,
        "version": version["version"],
        "binary": external_file_reference(executable),
        "returncode": version["returncode"],
    }


def torch_mps_info() -> dict[str, Any]:
    if importlib.util.find_spec("torch") is None:
        return {
            "torch_importable": False,
            "mps_built": False,
            "mps_available": False,
            "mps_tensor_smoke": {"status": "not_run"},
        }
    import torch  # type: ignore[import-not-found]

    mps = getattr(getattr(torch, "backends", None), "mps", None)
    mps_built = bool(mps and mps.is_built())
    mps_available = bool(mps and mps.is_available())
    smoke: dict[str, Any] = {"status": "skipped", "reason": "MPS backend unavailable"}
    if mps_available:
        try:
            tensor = torch.ones((8, 8), device="mps", dtype=torch.float32)
            result = (tensor * 2).sum()
            if hasattr(torch, "mps") and hasattr(torch.mps, "synchronize"):
                torch.mps.synchronize()
            smoke = {
                "status": "passed",
                "device": str(tensor.device),
                "dtype": str(tensor.dtype),
                "shape": list(tensor.shape),
                "sum": float(result.detach().cpu().item()),
            }
        except Exception as error:  # pragma: no cover - environment-dependent path
            smoke = {
                "status": "failed",
                "error": str(error),
            }
    config_text = ""
    try:
        config_text = str(torch.__config__.show())
    except Exception as error:  # pragma: no cover - environment-dependent path
        config_text = f"unavailable: {error}"
    return {
        "torch_importable": True,
        "torch_version": getattr(torch, "__version__", None),
        "mps_built": mps_built,
        "mps_available": mps_available,
        "mps_tensor_smoke": smoke,
        "config_sha256": hashlib.sha256(config_text.encode("utf-8")).hexdigest(),
        "config_excerpt": config_text.splitlines()[:40],
    }


def onnxruntime_web_info() -> dict[str, Any]:
    package_json_path = PROJECT_ROOT / "web" / "package.json"
    package_lock_path = PROJECT_ROOT / "web" / "package-lock.json"
    package_json = read_json(package_json_path)
    package_lock = read_json(package_lock_path) if package_lock_path.exists() else {}
    lock_record = (
        package_lock.get("packages", {})
        .get("node_modules/onnxruntime-web", {})
    )
    declared = package_json.get("dependencies", {}).get("onnxruntime-web")
    installed = lock_record.get("version")
    return {
        "package": "onnxruntime-web",
        "declared": declared,
        "installed": installed,
        "wasm_runtime_expected": True,
        "expected_license": "MIT",
        "license": lock_record.get("license"),
        "license_matches_expected": lock_record.get("license") == "MIT",
        "source_tarball_url": lock_record.get("resolved"),
        "package_integrity": lock_record.get("integrity"),
    }


def system_info() -> dict[str, Any]:
    mac_ver = platform.mac_ver()
    return {
        "system": platform.system(),
        "release": platform.release(),
        "version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "macos_version": mac_ver[0],
        "platform": platform.platform(),
    }


def python_environment_info() -> dict[str, Any]:
    freeze = command_output([sys.executable, "-m", "pip", "freeze", "--all"])
    freeze_lines = [line for line in freeze["stdout"].splitlines() if line.strip()]
    return {
        "executable": sys.executable,
        "executable_file": external_file_reference(sys.executable),
        "version": platform.python_version(),
        "implementation": platform.python_implementation(),
        "compiler": platform.python_compiler(),
        "pip_freeze": {
            "returncode": freeze["returncode"],
            "package_count": len(freeze_lines),
            "stdout_sha256": hashlib.sha256(freeze["stdout"].encode("utf-8")).hexdigest(),
            "stderr_sha256": hashlib.sha256(freeze["stderr"].encode("utf-8")).hexdigest(),
        },
    }


def node_environment_info() -> dict[str, Any]:
    node_path = shutil.which("node")
    npm_path = shutil.which("npm")
    node_version = command_version([node_path, "--version"]) if node_path else {
        "available": False,
        "version": None,
        "returncode": None,
        "command": ["node", "--version"],
    }
    npm_version = command_version([npm_path, "--version"]) if npm_path else {
        "available": False,
        "version": None,
        "returncode": None,
        "command": ["npm", "--version"],
    }
    return {
        "node": {
            "path": node_path,
            "binary": external_file_reference(node_path),
            **node_version,
        },
        "npm": {
            "path": npm_path,
            "binary": external_file_reference(npm_path),
            **npm_version,
        },
    }


def current_environment_report() -> dict[str, Any]:
    findings: list[str] = []
    python_packages = {}
    for name, expected in REQUIRED_PYTHON_PACKAGES.items():
        python_packages[name] = package_provenance(name, expected, findings)

    mps = torch_mps_info()
    if not mps["torch_importable"]:
        findings.append("torch must be importable for decode/train/export")
    if not mps["mps_built"]:
        findings.append("PyTorch MPS backend must be built for the intended local GPU path")
    if not mps["mps_available"]:
        findings.append("PyTorch MPS backend must be available on this device")
    if mps.get("mps_tensor_smoke", {}).get("status") != "passed":
        findings.append("PyTorch MPS tensor smoke must allocate and compute on the local GPU")

    ffmpeg = ffmpeg_info()
    if not ffmpeg["available"]:
        findings.append("ffmpeg must be installed on PATH for raw video decoding")
    if not ffmpeg.get("binary", {}).get("sha256"):
        findings.append("ffmpeg binary must be hash-pinned for final environment evidence")

    browser_runtime = onnxruntime_web_info()
    if not browser_runtime["declared"]:
        findings.append("web/package.json must declare onnxruntime-web")
    if not browser_runtime["installed"]:
        findings.append("web/package-lock.json must include installed onnxruntime-web")
    if browser_runtime.get("license") != "MIT":
        findings.append("web/package-lock.json must prove onnxruntime-web MIT license")
    if not browser_runtime.get("source_tarball_url") or not browser_runtime.get("package_integrity"):
        findings.append("web/package-lock.json must include onnxruntime-web source tarball URL and integrity")

    python = python_environment_info()
    if not python["executable_file"]["sha256"]:
        findings.append("Python executable must be hash-pinned for final environment evidence")
    if python["pip_freeze"]["returncode"] != 0:
        findings.append("pip freeze must succeed for final environment evidence")
    node = node_environment_info()
    if not node["node"]["available"]:
        findings.append("node must be available on PATH")
    if not node["npm"]["available"]:
        findings.append("npm must be available on PATH")
    if not node["node"]["binary"]["sha256"]:
        findings.append("node binary must be hash-pinned for final environment evidence")

    storage = storage_headroom_info(findings)
    hardware_resources = hardware_resources_info(findings)

    summary: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "status": "passed" if not findings else "failed",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "audit_script": file_reference(Path(__file__)),
        "project_files": project_file_references(findings),
        "system": system_info(),
        "hardware_resources": hardware_resources,
        "python": python,
        "node": node,
        "python_packages": python_packages,
        "torch": mps,
        "ffmpeg": ffmpeg,
        "storage": storage,
        "browser_runtime": browser_runtime,
        "python_onnxruntime": {
            "installed": package_version("onnxruntime"),
            "required": False,
            "reason": "Browser inference uses onnxruntime-web/wasm; Python onnxruntime is not required for the current path.",
        },
        "blockers": findings,
    }
    summary["status"] = "passed" if not findings else "failed"
    return summary


def stable_report_view(report: dict[str, Any]) -> dict[str, Any]:
    stable = json.loads(json.dumps(report, sort_keys=True))
    stable.pop("generated_at", None)
    storage = stable.get("storage")
    if isinstance(storage, dict):
        for key in (
            "total_bytes",
            "used_bytes",
            "available_bytes",
            "total_gib",
            "used_gib",
            "available_gib",
            "minimum_passed",
            "recommended_passed",
            "operational_warning",
        ):
            storage.pop(key, None)
    return stable


def validate_retained_report(report_path: Path, current: dict[str, Any] | None = None) -> list[str]:
    findings: list[str] = []
    resolved = resolve_project_path(report_path)
    if not resolved.exists():
        return [
            f"Retained local ML/GPU environment report is missing: {project_relative(resolved)}",
            "Run ./.venv/bin/python scripts/audit_local_ml_environment.py --write-report before final decode/train/eval/export.",
        ]
    try:
        retained = read_json(resolved)
    except json.JSONDecodeError as error:
        return [f"Retained local ML/GPU environment report is invalid JSON: {error}"]
    if not isinstance(retained, dict):
        return ["Retained local ML/GPU environment report root must be an object"]

    if retained.get("schema_version") != SCHEMA_VERSION:
        findings.append(f"Retained local ML/GPU environment report schema_version must be {SCHEMA_VERSION}")
    if retained.get("status") != "passed":
        findings.append("Retained local ML/GPU environment report status must be passed")
    blockers = retained.get("blockers")
    if blockers != []:
        findings.append("Retained local ML/GPU environment report blockers must be empty")
    if not isinstance(retained.get("generated_at"), str) or not retained["generated_at"].strip():
        findings.append("Retained local ML/GPU environment report generated_at must be present")
    storage = retained.get("storage")
    if not isinstance(storage, dict):
        findings.append("Retained local ML/GPU environment report must include storage headroom evidence")
    else:
        if storage.get("minimum_available_gib") != MIN_STORAGE_AVAILABLE_BYTES // GIB:
            findings.append(
                "Retained local ML/GPU environment report storage.minimum_available_gib "
                f"must be {MIN_STORAGE_AVAILABLE_BYTES // GIB}"
            )
        if storage.get("recommended_available_gib") != RECOMMENDED_STORAGE_AVAILABLE_BYTES // GIB:
            findings.append(
                "Retained local ML/GPU environment report storage.recommended_available_gib "
                f"must be {RECOMMENDED_STORAGE_AVAILABLE_BYTES // GIB}"
            )
        if storage.get("minimum_passed") is not True:
            findings.append("Retained local ML/GPU environment report storage.minimum_passed must be true")
        if "headroom" not in str(storage.get("purpose", "")):
            findings.append("Retained local ML/GPU environment report storage.purpose must describe artifact headroom")
    hardware_resources = retained.get("hardware_resources")
    if not isinstance(hardware_resources, dict):
        findings.append("Retained local ML/GPU environment report must include sanitized hardware resource evidence")
    else:
        if hardware_resources.get("apple_silicon") is not True:
            findings.append("Retained local ML/GPU environment report hardware_resources.apple_silicon must be true")
        if hardware_resources.get("minimums_passed") is not True:
            findings.append("Retained local ML/GPU environment report hardware_resources.minimums_passed must be true")
        if hardware_resources.get("minimum_memory_gib") != MIN_MEMORY_BYTES // GIB:
            findings.append(
                "Retained local ML/GPU environment report hardware_resources.minimum_memory_gib "
                f"must be {MIN_MEMORY_BYTES // GIB}"
            )
        if hardware_resources.get("minimum_logical_cpu_cores") != MIN_LOGICAL_CPU_CORES:
            findings.append(
                "Retained local ML/GPU environment report hardware_resources.minimum_logical_cpu_cores "
                f"must be {MIN_LOGICAL_CPU_CORES}"
            )
        if hardware_resources.get("minimum_apple_gpu_cores") != MIN_APPLE_GPU_CORES:
            findings.append(
                "Retained local ML/GPU environment report hardware_resources.minimum_apple_gpu_cores "
                f"must be {MIN_APPLE_GPU_CORES}"
            )
        if "MPS" not in str(hardware_resources.get("purpose", "")):
            findings.append("Retained local ML/GPU environment report hardware_resources.purpose must describe MPS use")

    current = current or current_environment_report()
    for blocker in current.get("blockers", []):
        findings.append(f"Current local ML/GPU environment blocker: {blocker}")
    if stable_report_view(retained) != stable_report_view(current):
        findings.append(
            "Retained local ML/GPU environment report is stale; rerun "
            "./.venv/bin/python scripts/audit_local_ml_environment.py --write-report"
        )
    return findings


def main() -> int:
    args = parse_args()
    current = current_environment_report()
    write_report = args.write_report
    if write_report is not None:
        write_json(resolve_project_path(write_report), current)

    blockers = list(current["blockers"])
    retained_report_path = args.report
    if retained_report_path is not None:
        blockers = validate_retained_report(retained_report_path, current)
    output = dict(current)
    output["status"] = "passed" if not blockers else "failed"
    output["blockers"] = blockers
    if write_report is not None:
        output["written_report"] = project_relative(resolve_project_path(write_report))
    if retained_report_path is not None:
        output["retained_report"] = project_relative(resolve_project_path(retained_report_path))
    print(json.dumps(output, indent=2, sort_keys=True))
    return 0 if not blockers else 1


if __name__ == "__main__":
    raise SystemExit(main())
