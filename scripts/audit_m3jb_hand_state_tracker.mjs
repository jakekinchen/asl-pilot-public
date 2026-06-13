#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const sideRoot = "/Users/kelly/Developer/asl-pilot-annotator";
const sideToolRoot = path.join(sideRoot, "tools/detector0-annotator");
const sideRawPopSignGame = path.join(sideRoot, "data/external/popsign-v1/raw/popsign_v1_0/game");
const sideRawAslCitizenVideos = path.join(sideRoot, "data/external/asl-citizen/ASL_Citizen/videos");
const sideLabelPython = path.join(sideRoot, ".labelvenv/bin/python");
const webPreviewRoot = "/Users/kelly/Developer/asl-pilot-web";
const receiptPath = "docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json";
const frameEdgeDispositionManifestPath =
  "docs/validation/return-to-form-m3jb-frame-edge-disposition-manifest-v1.json";
const frameEdgeExclusionSeedPath =
  "docs/validation/return-to-form-m3jb-frame-edge-exclusion-seed-v1.json";
const clearerSourceReviewSubsetPath =
  "docs/validation/return-to-form-m3jb-clearer-source-review-subset-v1.json";
const clearerSourceReviewOutcomesPath =
  "docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json";
const clearerSourceReviewPacketPath =
  "docs/review/return-to-form-m3jb-clearer-source-review-packet-v1.json";
const landmarkCacheRebuildEvalReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-cache-rebuild-eval-v1.json";
const landmarkRetrainBrevPlanReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-retrain-brev-plan-v1.json";
const landmarkRetrainBrevRunReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-retrain-brev-run-v1.json";
const landmarkRetrainRegressionPivotReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-retrain-regression-pivot-v1.json";
const landmarkPckCampaignResearchPlanReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-pck-campaign-research-plan-v1.json";
const landmarkPckCampaignRun1ReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-pck-campaign-run1-w96-g48-fulltrain-brev-v1.json";
const landmarkPckCampaignRun2ReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-pck-campaign-run2-w128-g64-fulltrain-brev-v1.json";
const landmarkPckCampaignRun3ReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-pck-campaign-run3-w128-g64-hardgeomaug-fulltrain-brev-v1.json";
const landmarkPckResearchRefreshAfterRun3ReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-pck-research-refresh-after-run3-v1.json";
const landmarkPckResunetArchitecturePreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-pck-resunet-architecture-preflight-v1.json";
const landmarkRetrainLocalPreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-landmark-retrain-local-preflight-v1.json";
const brevReadinessRefreshReceiptPath =
  "docs/validation/return-to-form-m3jb-brev-readiness-refresh-v1.json";
const brevApprovalRequestReceiptPath =
  "docs/validation/return-to-form-m3jb-brev-approval-request-v1.json";
const brevApprovalBlockerReceiptPath =
  "docs/validation/return-to-form-m3jb-brev-approval-blocker-v1.json";
const codexSupervisorDryRunReceiptPath =
  "docs/validation/return-to-form-m3jb-codex-supervisor-dry-run-v1.json";
const codexBothDryRunReceiptPath =
  "docs/validation/return-to-form-m3jb-codex-both-dry-run-v1.json";
const activePromptPath = "docs/model/return-to-form-m3jb-hierarchical-hand-state-tracker-goal-loop-prompt.md";
const landmarkRetrainApprovalGateToken =
  "await_explicit_brev_spend_approval_then_launch_landmark_retrain_brev_plan";
const landmarkRetrainApprovedNextAction =
  "launch_approved_landmark_retrain_brev_plan_v1";
const landmarkRetrainRegressionPivotNextAction =
  "analyze_m3jb_landmark_retrain_regression_and_select_pivot_no_brev";
const landmarkResolutionCapacityPreflightNextAction =
  "m3jb_landmark_resolution_capacity_preflight_no_brev";
const landmarkPckCampaignDirective =
  "m3jb_research_guided_landmark_pck_exploration_campaign_brev_ok";
const landmarkPckCampaignRun1NextAction =
  "m3jb_landmark_pck_run1_w96_g48_fulltrain_brev_ok";
const landmarkPckCampaignRun2NextAction =
  "m3jb_landmark_pck_run2_w128_g64_fulltrain_brev_ok";
const landmarkPckCampaignRun3NextAction =
  "m3jb_landmark_pck_run3_w128_g64_hardgeom_aug_fulltrain_brev_ok";
const landmarkPckResearchRefreshAfterRun3NextAction =
  "m3jb_landmark_pck_research_refresh_after_run3_no_brev";
const landmarkPckResunetArchitecturePreflightNextAction =
  "m3jb_landmark_pck_resunet_architecture_preflight_no_brev";
const landmarkPckRun4ResunetG64BrevToken =
  "m3jb_landmark_pck_run4_resunet_g64_fulltrain_brev_ok";
const recognizerSchedulerPreflightNextAction =
  "m3jb_recognizer_transformer_lr_schedule_preflight_no_brev";
const recognizerRun3SchedulerFulltrainNextAction =
  "m3jb_recognizer_transformer_run3_scheduler_fulltrain_brev_ok";
const recognizerRun3ResearchTuningNextAction =
  "m3jb_recognizer_transformer_run3_research_guided_tuning_no_brev";
const recognizerT32CacheLoaderPreflightNextAction =
  "m3jb_recognizer_transformer_t32_cache_loader_preflight_no_brev";
const recognizerT32CacheMaterializeNextAction =
  "m3jb_recognizer_transformer_t32_cache_materialize_validate_no_brev";
const recognizerT32FullCacheMaterializeNextAction =
  "m3jb_recognizer_transformer_t32_full_cache_materialize_validate_no_brev";
const recognizerRun4T32FulltrainNextAction =
  "m3jb_recognizer_transformer_run4_t32_fulltrain_brev_ok";
const recognizerRun4T32WaitForHealthyWorkerNextAction =
  "m3jb_recognizer_transformer_run4_t32_wait_for_healthy_brev_worker_or_infra_approval";
const recognizerRun4ResearchTuningNextAction =
  "m3jb_recognizer_transformer_run4_research_guided_tuning_no_brev";
const recognizerRun5SupconPreflightNextAction =
  "m3jb_recognizer_transformer_run5_supcon_aux_loss_preflight_no_brev";
const recognizerRun5SupconFulltrainNextAction =
  "m3jb_recognizer_transformer_run5_supcon_fulltrain_brev_ok";
const recognizerRun5ResearchTuningNextAction =
  "m3jb_recognizer_transformer_run5_research_guided_tuning_no_brev";
const recognizerRun6VerificationMarginPreflightNextAction =
  "m3jb_recognizer_transformer_run6_verification_margin_and_selection_preflight_no_brev";
const recognizerRun6VerifselectFulltrainNextAction =
  "m3jb_recognizer_transformer_run6_t32_verifselect_fulltrain_brev_ok";
const recognizerRun6ResearchTuningNextAction =
  "m3jb_recognizer_transformer_run6_research_guided_tuning_no_brev";
const recognizerRun7VerificationTailAuditNextAction =
  "m3jb_recognizer_transformer_run7_verification_tail_audit_no_brev";
const recognizerRun7ClassBalancedCeFulltrainNextAction =
  "m3jb_recognizer_transformer_run7_class_balanced_ce_fulltrain_brev_ok";
const recognizerRun7HardNegativeObjectiveResearchNextAction =
  "m3jb_recognizer_transformer_run7_hard_negative_objective_research_no_brev";
const recognizerRun7OvrBceHardnegPreflightNextAction =
  "m3jb_recognizer_transformer_run7_ovr_bce_hardneg_preflight_no_brev";
const recognizerRun7OvrBceHardnegFulltrainNextAction =
  "m3jb_recognizer_transformer_run7_ovr_bce_hardneg_fulltrain_brev_ok";
const recognizerRun7OvrBceResearchTuningNextAction =
  "m3jb_recognizer_transformer_run7_ovr_bce_research_guided_tuning_no_brev";
const recognizerRun6VsRun7CalibrationAuditNextAction =
  "m3jb_recognizer_transformer_run6_vs_run7_paired_verification_calibration_audit_no_brev";
const recognizerRun7TestRecallReproductionDiscrepancyNextAction =
  "m3jb_recognizer_transformer_run7_test_recall_reproduction_discrepancy_audit_no_brev";
const recognizerRun8OvrBceW001PreflightNextAction =
  "m3jb_recognizer_transformer_run8_ovr_bce_w001_preflight_no_brev";
const recognizerRun8OvrBceW001FulltrainNextAction =
  "m3jb_recognizer_transformer_run8_ovr_bce_w001_fulltrain_brev_ok";
const recognizerRun8OvrBceW001WaitForHealthyWorkerNextAction =
  "m3jb_recognizer_transformer_run8_ovr_bce_w001_wait_for_healthy_brev_worker_or_infra_approval";
const recognizerRun8OvrBceW001ResearchTuningNextAction =
  "m3jb_recognizer_transformer_run8_ovr_bce_w001_research_guided_tuning_no_brev";
const recognizerRun6Run7Run8CalibrationTailAuditNextAction =
  "m3jb_recognizer_transformer_run6_run7_run8_calibration_tail_audit_no_brev";
const recognizerPostOvrBceCalibrationSafeResearchNextAction =
  "m3jb_recognizer_transformer_post_ovr_bce_calibration_safe_research_no_brev";
const recognizerRun6MonitorSelectionStabilityPreflightNextAction =
  "m3jb_recognizer_transformer_run6_monitor_selection_stability_preflight_no_brev";
const recognizerCandidateCheckpointRetentionPreflightNextAction =
  "m3jb_recognizer_transformer_candidate_checkpoint_retention_preflight_no_brev";
const recognizerRetentionEnabledResearchTuningNextAction =
  "m3jb_recognizer_transformer_retention_enabled_research_guided_tuning_no_brev";
const recognizerRun9RetentionEnabledRun6RecipePreflightNextAction =
  "m3jb_recognizer_transformer_run9_retention_enabled_run6_recipe_preflight_no_brev";
const recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction =
  "m3jb_recognizer_transformer_run9_retention_enabled_brev_auth_visibility_refresh_no_spend";
const recognizerRun9RetentionEnabledRun6FulltrainAfterAuthNextAction =
  "m3jb_recognizer_transformer_run9_retention_enabled_run6_fulltrain_brev_ok_after_auth";
const recognizerRun9RetentionEnabledAwaitBrevLoginNextAction =
  "m3jb_recognizer_transformer_run9_retention_enabled_await_brev_login_then_visibility_refresh_no_spend";
const recognizerRun9RetentionEnabledWaitForHumanBrevLoginNextAction =
  "m3jb_recognizer_transformer_run9_retention_enabled_wait_for_human_brev_login_confirmation";
const recognizerSchedulerPreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-lr-schedule-preflight-v1.json";
const recognizerRun3SchedulerFulltrainReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run3-scheduler-brev-v1.json";
const recognizerRun3ResearchTuningReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run3-research-tuning-v1.json";
const recognizerT32CacheLoaderPreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-t32-cache-loader-preflight-v1.json";
const recognizerT32CacheSmokeValidateReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-t32-cache-smoke-validate-v1.json";
const recognizerT32FullCacheValidateReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-t32-full-cache-validate-v1.json";
const recognizerRun4T32PreflightBlockerReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run4-t32-brev-preflight-blocker-v1.json";
const recognizerRun4T32HealthRefreshReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run4-t32-brev-health-refresh-v1.json";
const recognizerRun4T32FulltrainReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run4-t32-brev-v1.json";
const recognizerRun4ResearchTuningReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run4-research-tuning-v1.json";
const recognizerRun5SupconPreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run5-supcon-preflight-v1.json";
const recognizerRun5SupconFulltrainReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run5-supcon-brev-v1.json";
const recognizerRun5ResearchTuningReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run5-research-tuning-v1.json";
const recognizerRun6VerificationMarginPreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run6-verification-margin-preflight-v1.json";
const recognizerRun6T32PreflightBlockerReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run6-t32-brev-preflight-blocker-v1.json";
const recognizerRun6VerifselectFulltrainReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run6-verifselect-brev-v1.json";
const recognizerRun6ResearchTuningReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run6-research-tuning-v1.json";
const recognizerRun7VerificationTailAuditReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run7-verification-tail-audit-v1.json";
const recognizerRun7HardNegativeObjectiveResearchReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run7-hard-negative-objective-research-v1.json";
const recognizerRun7OvrBceHardnegPreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run7-ovr-bce-hardneg-preflight-v1.json";
const recognizerRun7OvrBceHardnegFulltrainReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run7-ovr-bce-hardneg-brev-v1.json";
const recognizerRun7OvrBceResearchTuningReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run7-ovr-bce-research-tuning-v1.json";
const recognizerRun6VsRun7CalibrationAuditReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run6-vs-run7-paired-calibration-audit-v1.json";
const recognizerRun7TestRecallReproductionDiscrepancyReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run7-test-recall-reproduction-discrepancy-audit-v1.json";
const recognizerRun8OvrBceW001PreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run8-ovr-bce-w001-preflight-v1.json";
const recognizerRun8OvrBceW001PreflightBlockerReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run8-ovr-bce-w001-brev-preflight-blocker-v1.json";
const recognizerRun8OvrBceW001FulltrainReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run8-ovr-bce-w001-brev-v1.json";
const recognizerRun8OvrBceW001ResearchTuningReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run8-ovr-bce-w001-research-tuning-v1.json";
const recognizerRun6Run7Run8CalibrationTailAuditReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run6-run7-run8-calibration-tail-audit-v1.json";
const recognizerPostOvrBceCalibrationSafeResearchReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-post-ovr-bce-calibration-safe-research-v1.json";
const recognizerRun6MonitorSelectionStabilityPreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run6-monitor-selection-stability-preflight-v1.json";
const recognizerCandidateCheckpointRetentionPreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-candidate-checkpoint-retention-preflight-v1.json";
const recognizerRetentionEnabledResearchTuningReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-retention-enabled-research-tuning-v1.json";
const recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run9-retention-enabled-run6-recipe-preflight-v1.json";
const recognizerRun9BrevAuthVisibilityRefreshReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-visibility-refresh-v1.json";
const recognizerRun9BrevAuthVisibilityRetryReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-visibility-retry-v1.json";
const recognizerRun9BrevAuthHumanLoginBoundaryReceiptPath =
  "docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-human-login-boundary-v1.json";
const recognizerSchedulerTinyOverfitReceiptPath =
  "docs/validation/m3jb-recognizer-scheduler-preflight-tiny-overfit-v1.json";
const recognizerSchedulerFullDataSmokeReceiptPath =
  "docs/validation/m3jb-recognizer-scheduler-preflight-full-data-smoke-v1.json";
const recognizerT32LoaderDryrunReceiptPath =
  "docs/validation/m3jb-recognizer-t32-loader-preflight-dryrun-current-t20-v1.json";
const recognizerT32CacheSmokeDryrunReceiptPath =
  "docs/validation/m3jb-recognizer-t32-cache-smoke-dryrun-cpw1-v1.json";
const recognizerT32FullCacheDryrunReceiptPath =
  "docs/validation/m3jb-recognizer-t32-full-cache-dryrun-v1.json";
const recognizerRun5SupconZeroWeightDryrunReceiptPath =
  "docs/validation/m3jb-recognizer-run5-supcon-preflight-zero-weight-dryrun-v1.json";
const recognizerRun5SupconWeight005DryrunReceiptPath =
  "docs/validation/m3jb-recognizer-run5-supcon-preflight-weight005-dryrun-v1.json";
const recognizerRun6VerificationMarginDiagnosticReceiptPath =
  "docs/validation/m3jb-recognizer-run6-verification-margin-diagnostic-v1.json";
const recognizerRun6VerifselectDryrunReceiptPath =
  "docs/validation/m3jb-recognizer-run6-verifselect-dryrun-v1.json";
const recognizerRun7VerificationTailDiagnosticReceiptPath =
  "docs/validation/m3jb-recognizer-run7-verification-tail-audit-v1.json";
const recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptPath =
  "docs/validation/m3jb-recognizer-run7-ovr-bce-hardneg-preflight-zero-weight-dryrun-v1.json";
const recognizerRun7OvrBceHardnegWeight003DryrunReceiptPath =
  "docs/validation/m3jb-recognizer-run7-ovr-bce-hardneg-preflight-weight003-dryrun-v1.json";
const recognizerRun8OvrBceW001DryrunReceiptPath =
  "docs/validation/m3jb-recognizer-run8-ovr-bce-w001-preflight-dryrun-v1.json";
const recognizerRun6VsRun7CalibrationDetailedReceiptPath =
  "docs/validation/m3jb-recognizer-run6-vs-run7-paired-calibration-audit-v1.json";
const recognizerRun6Run7Run8CalibrationTailDetailedReceiptPath =
  "docs/validation/m3jb-recognizer-run6-run7-run8-calibration-tail-audit-v1.json";
const recognizerRun6MonitorSelectionStabilityDetailedReceiptPath =
  "docs/validation/m3jb-recognizer-run6-monitor-selection-stability-preflight-v1.json";
const recognizerCandidateCheckpointRetentionDryrunReceiptPath =
  "docs/validation/m3jb-recognizer-candidate-checkpoint-retention-preflight-dryrun-v1.json";
const recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath =
  "docs/validation/m3jb-recognizer-run9-retention-enabled-run6-recipe-preflight-dryrun-v1.json";
const recognizerRetentionEnabledResearchTuningArtifactDir =
  "artifacts/research/m3jb-recognizer-transformer-retention-enabled-tuning-953";
const recognizerRetentionEnabledResearchTuningPromptPath =
  `${recognizerRetentionEnabledResearchTuningArtifactDir}/prompt.md`;
const recognizerRetentionEnabledResearchTuningRequestPath =
  `${recognizerRetentionEnabledResearchTuningArtifactDir}/request.json`;
const recognizerRetentionEnabledResearchTuningRawPath =
  `${recognizerRetentionEnabledResearchTuningArtifactDir}/raw.json`;
const recognizerRetentionEnabledResearchTuningResponsePath =
  `${recognizerRetentionEnabledResearchTuningArtifactDir}/response.md`;
const landmarkPckResearchRefreshAfterRun3ArtifactDir =
  "artifacts/research/m3jb-landmark-pck-refresh-909";
const landmarkPckResearchRefreshAfterRun3PromptPath =
  `${landmarkPckResearchRefreshAfterRun3ArtifactDir}/prompt.md`;
const landmarkPckResearchRefreshAfterRun3RequestPath =
  `${landmarkPckResearchRefreshAfterRun3ArtifactDir}/request.json`;
const landmarkPckResearchRefreshAfterRun3RawPath =
  `${landmarkPckResearchRefreshAfterRun3ArtifactDir}/raw.json`;
const landmarkPckResearchRefreshAfterRun3ResponsePath =
  `${landmarkPckResearchRefreshAfterRun3ArtifactDir}/response.md`;
const recognizerRun3ResearchTuningArtifactDir =
  "artifacts/research/m3jb-recognizer-transformer-run3-tuning-923";
const recognizerRun3ResearchTuningPromptPath =
  `${recognizerRun3ResearchTuningArtifactDir}/prompt.md`;
const recognizerRun3ResearchTuningRequestPath =
  `${recognizerRun3ResearchTuningArtifactDir}/request.json`;
const recognizerRun3ResearchTuningRawPath =
  `${recognizerRun3ResearchTuningArtifactDir}/raw.json`;
const recognizerRun3ResearchTuningResponsePath =
  `${recognizerRun3ResearchTuningArtifactDir}/response.md`;
const recognizerRun4ResearchTuningArtifactDir =
  "artifacts/research/m3jb-recognizer-transformer-run4-tuning-930";
const recognizerRun4ResearchTuningPromptPath =
  `${recognizerRun4ResearchTuningArtifactDir}/prompt.md`;
const recognizerRun4ResearchTuningRequestPath =
  `${recognizerRun4ResearchTuningArtifactDir}/request.json`;
const recognizerRun4ResearchTuningRawPath =
  `${recognizerRun4ResearchTuningArtifactDir}/raw.json`;
const recognizerRun4ResearchTuningResponsePath =
  `${recognizerRun4ResearchTuningArtifactDir}/response.md`;
const recognizerRun5ResearchTuningArtifactDir =
  "artifacts/research/m3jb-recognizer-transformer-run5-tuning-933";
const recognizerRun5ResearchTuningPromptPath =
  `${recognizerRun5ResearchTuningArtifactDir}/prompt.md`;
const recognizerRun5ResearchTuningRequestPath =
  `${recognizerRun5ResearchTuningArtifactDir}/request.json`;
const recognizerRun5ResearchTuningRawPath =
  `${recognizerRun5ResearchTuningArtifactDir}/raw.json`;
const recognizerRun5ResearchTuningResponsePath =
  `${recognizerRun5ResearchTuningArtifactDir}/response.md`;
const recognizerRun6ResearchTuningArtifactDir =
  "artifacts/research/m3jb-recognizer-transformer-run6-tuning-937";
const recognizerRun6ResearchTuningPromptPath =
  `${recognizerRun6ResearchTuningArtifactDir}/prompt.md`;
const recognizerRun6ResearchTuningRequestPath =
  `${recognizerRun6ResearchTuningArtifactDir}/request.json`;
const recognizerRun6ResearchTuningRawPath =
  `${recognizerRun6ResearchTuningArtifactDir}/raw.json`;
const recognizerRun6ResearchTuningResponsePath =
  `${recognizerRun6ResearchTuningArtifactDir}/response.md`;
const recognizerRun7HardNegativeObjectiveResearchArtifactDir =
  "artifacts/research/m3jb-recognizer-transformer-run7-hard-negative-objective-939";
const recognizerRun7HardNegativeObjectiveResearchPromptPath =
  `${recognizerRun7HardNegativeObjectiveResearchArtifactDir}/prompt.md`;
const recognizerRun7HardNegativeObjectiveResearchRequestPath =
  `${recognizerRun7HardNegativeObjectiveResearchArtifactDir}/request.json`;
const recognizerRun7HardNegativeObjectiveResearchRawPath =
  `${recognizerRun7HardNegativeObjectiveResearchArtifactDir}/raw.json`;
const recognizerRun7HardNegativeObjectiveResearchResponsePath =
  `${recognizerRun7HardNegativeObjectiveResearchArtifactDir}/response.md`;
const recognizerRun7OvrBceResearchTuningArtifactDir =
  "artifacts/research/m3jb-recognizer-transformer-run7-ovr-bce-postmortem-942";
const recognizerRun7OvrBceResearchTuningPromptPath =
  `${recognizerRun7OvrBceResearchTuningArtifactDir}/prompt.md`;
const recognizerRun7OvrBceResearchTuningRequestPath =
  `${recognizerRun7OvrBceResearchTuningArtifactDir}/request.json`;
const recognizerRun7OvrBceResearchTuningRawPath =
  `${recognizerRun7OvrBceResearchTuningArtifactDir}/raw.json`;
const recognizerRun7OvrBceResearchTuningResponsePath =
  `${recognizerRun7OvrBceResearchTuningArtifactDir}/response.md`;
const recognizerRun8OvrBceW001ResearchTuningArtifactDir =
  "artifacts/research/m3jb-recognizer-transformer-run8-ovr-bce-w001-postmortem-948";
const recognizerRun8OvrBceW001ResearchTuningPromptPath =
  `${recognizerRun8OvrBceW001ResearchTuningArtifactDir}/prompt.md`;
const recognizerRun8OvrBceW001ResearchTuningRequestPath =
  `${recognizerRun8OvrBceW001ResearchTuningArtifactDir}/request.json`;
const recognizerRun8OvrBceW001ResearchTuningRawPath =
  `${recognizerRun8OvrBceW001ResearchTuningArtifactDir}/raw.json`;
const recognizerRun8OvrBceW001ResearchTuningResponsePath =
  `${recognizerRun8OvrBceW001ResearchTuningArtifactDir}/response.md`;
const recognizerPostOvrBceCalibrationSafeResearchArtifactDir =
  "artifacts/research/m3jb-recognizer-transformer-post-ovr-bce-calibration-safe-950";
const recognizerPostOvrBceCalibrationSafeResearchPromptPath =
  `${recognizerPostOvrBceCalibrationSafeResearchArtifactDir}/prompt.md`;
const recognizerPostOvrBceCalibrationSafeResearchRequestPath =
  `${recognizerPostOvrBceCalibrationSafeResearchArtifactDir}/request.json`;
const recognizerPostOvrBceCalibrationSafeResearchRawPath =
  `${recognizerPostOvrBceCalibrationSafeResearchArtifactDir}/raw.json`;
const recognizerPostOvrBceCalibrationSafeResearchResponsePath =
  `${recognizerPostOvrBceCalibrationSafeResearchArtifactDir}/response.md`;
const sidePerHandLandmarkTrainerPath = path.join(
  sideToolRoot,
  "train_perhand_landmarks_heatmap.py",
);
const sidePerHandResunetArchitectureSmokePath = path.join(
  sideToolRoot,
  "output/m3jb-perhand-resunet-architecture-smoke-v1.json",
);
const sideRecognizerTrainerPath = path.join(
  sideToolRoot,
  "train_recognizer_distill.py",
);
const sideRecognizerVerificationPath = path.join(
  sideToolRoot,
  "verification.py",
);
const sideRecognizerVerificationMarginDiagnosticPath = path.join(
  sideToolRoot,
  "diagnose_verification_margins.py",
);
const sideRecognizerVerificationTailAuditTestPath = path.join(
  sideToolRoot,
  "test_verification_tail_audit.py",
);
const recognizerRun6VerificationMarginDiagnosticHistoricalSha256 =
  "f7a19e4fb4f200b694660c6ecaad9d2ec47ee4f0e91b9e19df889b9123d6f2d4";
const sideRecognizerTransformerPath = path.join(
  sideToolRoot,
  "seq_transformer.py",
);
const sideRecognizerDiagnosticsTestPath = path.join(
  sideToolRoot,
  "test_recognizer_distill_diagnostics.py",
);
const sideRecognizerRun3SchedulerReceiptPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run3-scheduler-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.json",
);
const sideRecognizerRun3SchedulerWeightsPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run3-scheduler-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.pt",
);
const sideRecognizerRun3SchedulerLogPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run3-scheduler-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.log",
);
const sideRecognizerRun4T32PretrainDryrunPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run4-t32-pretrain-dryrun-v1.json",
);
const sideRecognizerRun4T32FulltrainReceiptPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run4-t32-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.json",
);
const sideRecognizerRun4T32FulltrainWeightsPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run4-t32-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.pt",
);
const sideRecognizerRun4T32FulltrainLogPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run4-t32-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.log",
);
const sideRecognizerRun5SupconPretrainDryrunPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run5-supcon-pretrain-dryrun-v1.json",
);
const sideRecognizerRun5SupconFulltrainReceiptPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run5-supcon-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-supcon005-brev-v1.json",
);
const sideRecognizerRun5SupconFulltrainWeightsPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run5-supcon-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-supcon005-brev-v1.pt",
);
const sideRecognizerRun5SupconFulltrainLogPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run5-supcon-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-supcon005-brev-v1.log",
);
const sideRecognizerRun6VerifselectPretrainDryrunPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run6-t32-verifselect-pretrain-dryrun-v1.json",
);
const sideRecognizerRun6VerifselectFulltrainReceiptPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run6-t32-verifselect-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.json",
);
const sideRecognizerRun6VerifselectFulltrainWeightsPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run6-t32-verifselect-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.pt",
);
const sideRecognizerRun6VerifselectFulltrainLogPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run6-t32-verifselect-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.log",
);
const sideRecognizerRun8OvrBceW001PretrainDryrunPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run8-ovr-bce-w001-pretrain-dryrun-v1.json",
);
const sideRecognizerRun8OvrBceW001FulltrainReceiptPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run8-ovr-bce-w001-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-ovrbce001-brev-v1.json",
);
const sideRecognizerRun8OvrBceW001FulltrainWeightsPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run8-ovr-bce-w001-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-ovrbce001-brev-v1.pt",
);
const sideRecognizerRun8OvrBceW001FulltrainLogPath = path.join(
  sideToolRoot,
  "output/m3jb-recognizer-transformer-run8-ovr-bce-w001-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-ovrbce001-brev-v1.log",
);
const sideRecognizerT32SmokeRowsPath = path.join(
  sideToolRoot,
  ".cache/recog-seq-w64-t32-cpw1-v1/rows.json",
);
const sideRecognizerT32FullRowsPath = path.join(
  sideToolRoot,
  ".cache/recog-seq-w64-t32-merged-v1/rows.json",
);
const landmarkRetrainApprovalText =
  "I approve current-thread Brev/GPU spend for M3JB landmark retrain plan v1: use retained worker asl-pilot-m3eh-l40s-001 / 3d58wpy9o, max spend $40, max outer runtime 21600s, sync/copy only the files needed for docs/validation/return-to-form-m3jb-landmark-retrain-brev-plan-v1.json, run the recorded CUDA scratch landmark retrain, run eval-only PCK@0.10 and PCK@0.05, copy back the planned artifacts, and stop/cleanup according to the recorded kill conditions.";
const architecturePath = "ARCHITECTURE.md";
const computePolicyReceiptPath = "docs/validation/return-to-form-m3jb-brev-compute-policy-v1.json";
const pairRankObjectiveReceiptPath =
  "docs/validation/return-to-form-m3jb-pairrank-selector-objective-smoke-and-brev-provider-v1.json";
const pairMarginSelectorRepairReceiptPath =
  "docs/validation/return-to-form-m3jb-pairmargin-selector-repair-brev-v1.json";
const directPairScorerReceiptPath =
  "docs/validation/return-to-form-m3jb-direct-pair-scorer-smoke-and-brev-provider-blocker-v1.json";
const assignmentHeadRepairReceiptPath =
  "docs/validation/return-to-form-m3jb-overlap-aware-assignment-head-repair-brev-v1.json";
const focusedSliverRepairReceiptPath =
  "docs/validation/return-to-form-m3jb-focused-sliver-subproposal-repair-brev-v1.json";
const pairRankerCalibrationAuditReceiptPath =
  "docs/validation/return-to-form-m3jb-pair-ranker-calibration-audit-v1.json";
const directPairMarginObjectiveReceiptPath =
  "docs/validation/return-to-form-m3jb-direct-pair-margin-objective-smoke-v1.json";

const webPreviewEvidence = {
  liveTracker: path.join(webPreviewRoot, "web/src/lib/live-tracker.ts"),
  useLiveTracker: path.join(webPreviewRoot, "web/src/lib/use-live-tracker.ts"),
  practiceApp: path.join(webPreviewRoot, "web/src/components/PracticeApp.tsx"),
  lessonApp: path.join(webPreviewRoot, "web/src/components/LessonApp.tsx"),
  passFailDecision: path.join(webPreviewRoot, "web/src/lib/pass-fail-decision.ts"),
  clientModel: path.join(webPreviewRoot, "web/src/lib/client-model.ts"),
  browserModelBundle: path.join(webPreviewRoot, "web/public/model/browser-model-bundle.json"),
};

const sideReceipts = {
  pairRankerCode: path.join(sideToolRoot, "train_hand_pair_ranker.py"),
  detectorDistinct: path.join(
    sideToolRoot,
    "output/m3ja-hands2-hardgeom-os4-e40-lr5e4-cont-nms050-eval-distinct-v2.json",
  ),
  pairRankerCropPose: path.join(
    sideToolRoot,
    "output/m3ja-hand-pair-ranker-cropfeat-top20-fulltrain-e20-v1.json",
  ),
  perHandLandmarksPck010: path.join(
    sideToolRoot,
    "output/m3ja-perhand-hires-w64-e60-lr5e4-cont-e40-lr1e4-cont-e30.json",
  ),
  perHandLandmarksPck005: path.join(
    sideToolRoot,
    "output/m3ja-perhand-hires-w64-e60-lr5e4-cont-e40-lr1e4-cont-e30-eval-pck005.json",
  ),
  perHandQualityAudit: path.join(sideToolRoot, "output/m3ja-perhand-quality-cache-audit-test.json"),
  landmarkHeatmapTrainerCode: path.join(sideToolRoot, "train_hands_landmarks_heatmap.py"),
  perHandLandmarkTrainerCode: sidePerHandLandmarkTrainerPath,
  perHandResunetArchitectureSmoke: sidePerHandResunetArchitectureSmokePath,
  landmarkHeatmapBestPck010: path.join(
    sideToolRoot,
    "output/m3ja-landmarks-merged-w64-heatce-vis-e4.json",
  ),
  landmarkHeatmapBestPck005: path.join(
    sideToolRoot,
    "output/m3ja-landmarks-merged-w64-heatce-vis-e4-eval-pck005.json",
  ),
  sourcePreservedCropQualityAudit: path.join(
    sideToolRoot,
    "output/m3ja-perhand-rows-sourcepreserved-c35-currentbest-quality-audit-test.json",
  ),
  sourcePreservedCropQualityAuditTrain: path.join(
    sideToolRoot,
    "output/m3ja-perhand-rows-sourcepreserved-c35-currentbest-quality-audit-train.json",
  ),
  sourcePreservedRelabelCandidatesTest: path.join(
    sideToolRoot,
    "output/m3ja-perhand-rows-sourcepreserved-c35-relabel-candidates-test-top512.json",
  ),
  sourcePreservedRelabelCandidatesTrain: path.join(
    sideToolRoot,
    "output/m3ja-perhand-rows-sourcepreserved-c35-relabel-candidates-train-top1024.json",
  ),
  targetedRelabelCandidatesScript: path.join(sideToolRoot, "targeted_relabel_candidates.py"),
  targetedRelabelTrainTop32Rows: path.join(
    sideToolRoot,
    "output/m3jb-frameedge-oob-targeted-relabel-train-top32/rows.json",
  ),
  targetedRelabelTestTop32Rows: path.join(
    sideToolRoot,
    "output/m3jb-frameedge-oob-targeted-relabel-test-top32/rows.json",
  ),
  targetedRelabelTrainTop32SelectedOnlyRows: path.join(
    sideToolRoot,
    "output/m3jb-frameedge-oob-targeted-relabel-train-top32-selectedonly/rows.json",
  ),
  targetedRelabelTestTop32SelectedOnlyRows: path.join(
    sideToolRoot,
    "output/m3jb-frameedge-oob-targeted-relabel-test-top32-selectedonly/rows.json",
  ),
  pairRankerTargetsTop20: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-targets-top20-train2500-e10-v1.json",
  ),
  pairRankerTargetsValSelect: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-targets-top20-train2500-e20-valselect-v1.json",
  ),
  pairRankerTargetsValSelectWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-targets-top20-train2500-e20-valselect-v1.pt",
  ),
  candidateOracleSweep: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-oracle-sweep-top80-nms040506-v1.json",
  ),
  candidateRepairTargets: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-repair-targets-top40-nms050-v1.json",
  ),
  candidateRepairContactSheet: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-repair-targets-top40-nms050-v1.png",
  ),
  candidateNoLeakAnalogs: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-no-leak-analogs-top40-nms050-v1.json",
  ),
  candidateNoLeakAnalogsContactSheet: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-no-leak-analogs-top40-nms050-v1.png",
  ),
  candidateNoLeakAnalogsT065: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-no-leak-analogs-top40-nms050-t065-v1.json",
  ),
  candidateNoLeakAnalogsT065ContactSheet: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-no-leak-analogs-top40-nms050-t065-v1.png",
  ),
  proposalTrainAnalogProbe: path.join(
    sideToolRoot,
    "output/m3jb-hands2-trainanalog-os4-e8-lr1e4-v1.json",
  ),
  proposalTrainAnalogWeights: path.join(
    sideToolRoot,
    "output/m3jb-hands2-trainanalog-os4-e8-lr1e4-v1.pt",
  ),
  proposalTrainAnalogRender: path.join(
    sideToolRoot,
    "output/m3jb-hands2-trainanalog-os4-e8-lr1e4-v1.png",
  ),
  proposalTrainAnalogFailures: path.join(
    sideToolRoot,
    "output/m3jb-hands2-trainanalog-os4-e8-lr1e4-v1-failures.png",
  ),
  proposalTrainAnalogT065Probe: path.join(
    sideToolRoot,
    "output/m3jb-hands2-trainanalog-t065-os20-e8-lr1e4-v1.json",
  ),
  proposalTrainAnalogT065Weights: path.join(
    sideToolRoot,
    "output/m3jb-hands2-trainanalog-t065-os20-e8-lr1e4-v1.pt",
  ),
  proposalTrainAnalogT065Render: path.join(
    sideToolRoot,
    "output/m3jb-hands2-trainanalog-t065-os20-e8-lr1e4-v1.png",
  ),
  proposalTrainAnalogT065Failures: path.join(
    sideToolRoot,
    "output/m3jb-hands2-trainanalog-t065-os20-e8-lr1e4-v1-failures.png",
  ),
  subproposalOracle: path.join(
    sideToolRoot,
    "output/m3jb-hand-subproposal-oracle-top40-nms050-src8-aug160-v1.json",
  ),
  focusedSliverSubproposalOracleAug24: path.join(
    sideToolRoot,
    "output/m3jb-hand-subproposal-oracle-focusedsliver-top40-nms050-src8-aug24-v1.json",
  ),
  focusedSliverSubproposalOracleAug64: path.join(
    sideToolRoot,
    "output/m3jb-hand-subproposal-oracle-focusedsliver-top40-nms050-src8-aug64-v1.json",
  ),
  focusedSliverSubproposalOracleAug160: path.join(
    sideToolRoot,
    "output/m3jb-hand-subproposal-oracle-focusedsliver-top40-nms050-src8-aug160-v1.json",
  ),
  subproposalRankerGeom: path.join(
    sideToolRoot,
    "output/m3jb-hand-subproposal-ranker-geom-top40-src8-aug40-train2500-e12-v1.json",
  ),
  subproposalRankerGeomWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-subproposal-ranker-geom-top40-src8-aug40-train2500-e12-v1.pt",
  ),
  subproposalRankerSmoke: path.join(
    sideToolRoot,
    "output/m3jb-hand-subproposal-ranker-smoke-top4-src4-aug16-train32-e1-v1.json",
  ),
  subproposalRankerCropPose: path.join(
    sideToolRoot,
    "output/m3jb-hand-subproposal-ranker-croppose-top40-src8-aug24-train2500-e12-v1.json",
  ),
  subproposalRankerCropPoseWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-subproposal-ranker-croppose-top40-src8-aug24-train2500-e12-v1.pt",
  ),
  subproposalRankerCropPoseSmoke: path.join(
    sideToolRoot,
    "output/m3jb-hand-subproposal-ranker-croppose-smoke-top4-src4-aug16-train32-e1-v1.json",
  ),
  candidateHeadCropPoseSmoke: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-croppose-smoke-top4-src4-aug16-train32-e1-v1.json",
  ),
  candidateHeadCropPose: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-croppose-top40-src8-aug24-train2500-e12-v1.json",
  ),
  candidateHeadCropPoseWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-croppose-top40-src8-aug24-train2500-e12-v1.pt",
  ),
  candidateSelectionFailureAudit: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-selection-failure-audit-croppose-top40-src8-aug24-v1.json",
  ),
  candidateSelectionFailureContactSheet: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-selection-failure-audit-croppose-top40-src8-aug24-v1.png",
  ),
  candidateHeadPairRankSmoke: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-pairrank-croppose-top40-src4-aug16-train32-e1-smoke-v1.json",
  ),
  candidateHeadPairRankSmokeWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-pairrank-croppose-top40-src4-aug16-train32-e1-smoke-v1.pt",
  ),
  candidateHeadPairRankFullBrev: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-pairrank-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.json",
  ),
  candidateHeadPairRankFullBrevWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-pairrank-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.pt",
  ),
  candidateHeadPairRankFullBrevFailureAudit: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-selection-failure-audit-pairrank-croppose-top40-src8-aug24-fulltrain-e36-v1.json",
  ),
  candidateHeadPairRankFullBrevFailureContactSheet: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-selection-failure-audit-pairrank-croppose-top40-src8-aug24-fulltrain-e36-v1.png",
  ),
  candidateHeadPairMarginSmoke: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-pairmargin-croppose-top40-src4-aug16-train32-e1-smoke-v1.json",
  ),
  candidateHeadPairMarginSmokeWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-pairmargin-croppose-top40-src4-aug16-train32-e1-smoke-v1.pt",
  ),
  candidateHeadPairMarginFullBrev: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-pairmargin-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.json",
  ),
  candidateHeadPairMarginFullBrevWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-head-pairmargin-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.pt",
  ),
  candidateHeadPairMarginFullBrevFailureAudit: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-selection-failure-audit-pairmargin-croppose-top40-src8-aug24-fulltrain-e36-v1.json",
  ),
  candidateHeadPairMarginFullBrevFailureContactSheet: path.join(
    sideToolRoot,
    "output/m3jb-hand-candidate-selection-failure-audit-pairmargin-croppose-top40-src8-aug24-fulltrain-e36-v1.png",
  ),
  directPairScorerSmoke: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-directpair-croppose-top40-src4-aug16-train32-e1-smoke-v1.json",
  ),
  directPairScorerSmokeWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-directpair-croppose-top40-src4-aug16-train32-e1-smoke-v1.pt",
  ),
  directPairScorerFullBrev: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-directpair-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.json",
  ),
  directPairScorerFullBrevWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-directpair-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.pt",
  ),
  assignmentHeadFullBrev: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-assignmenthead-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.json",
  ),
  assignmentHeadFullBrevWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-assignmenthead-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.pt",
  ),
  assignmentHeadLossOnlyFullBrev: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-assignmenthead-lossonly-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.json",
  ),
  assignmentHeadLossOnlyFullBrevWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-assignmenthead-lossonly-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.pt",
  ),
  focusedSliverDirectPairFullBrev: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-focusedsliver-directpair-croppose-top40-src8-aug64-fulltrain-e36-brev-v1.json",
  ),
  focusedSliverDirectPairFullBrevWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-focusedsliver-directpair-croppose-top40-src8-aug64-fulltrain-e36-brev-v1.pt",
  ),
  focusedSliverDirectPairCalibrationAudit: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-focusedsliver-directpair-calibration-audit-top40-src8-aug64-fulltrain-e36-v1.json",
  ),
  focusedSliverDirectPairCalibrationContactSheet: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-focusedsliver-directpair-calibration-audit-top40-src8-aug64-fulltrain-e36-v1.png",
  ),
  directPairMarginSmoke: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-pairmargin-focusedsliver-src4-aug16-train32-e1-smoke-v1.json",
  ),
  directPairMarginSmokeWeights: path.join(
    sideToolRoot,
    "output/m3jb-hand-pair-ranker-pairmargin-focusedsliver-src4-aug16-train32-e1-smoke-v1.pt",
  ),
  landmarkPckCampaignRun1: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w96-g48-fulltrain-e100-lr5e4-brev-v1.json",
  ),
  landmarkPckCampaignRun1Weights: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w96-g48-fulltrain-e100-lr5e4-brev-v1.pt",
  ),
  landmarkPckCampaignRun1EvalPck010: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w96-g48-fulltrain-e100-lr5e4-brev-v1-eval-pck010.json",
  ),
  landmarkPckCampaignRun1EvalPck005: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w96-g48-fulltrain-e100-lr5e4-brev-v1-eval-pck005.json",
  ),
  landmarkPckCampaignRun2: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w128-g64-fulltrain-e100-lr5e4-brev-v1.json",
  ),
  landmarkPckCampaignRun2Weights: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w128-g64-fulltrain-e100-lr5e4-brev-v1.pt",
  ),
  landmarkPckCampaignRun2EvalPck010: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w128-g64-fulltrain-e100-lr5e4-brev-v1-eval-pck010.json",
  ),
  landmarkPckCampaignRun2EvalPck005: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w128-g64-fulltrain-e100-lr5e4-brev-v1-eval-pck005.json",
  ),
  landmarkPckCampaignRun3: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w128-g64-hardgeomaug-fulltrain-e100-lr5e4-brev-v1.json",
  ),
  landmarkPckCampaignRun3Weights: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w128-g64-hardgeomaug-fulltrain-e100-lr5e4-brev-v1.pt",
  ),
  landmarkPckCampaignRun3EvalPck010: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w128-g64-hardgeomaug-fulltrain-e100-lr5e4-brev-v1-eval-pck010.json",
  ),
  landmarkPckCampaignRun3EvalPck005: path.join(
    sideToolRoot,
    "output/m3jb-perhand-pckcampaign-w128-g64-hardgeomaug-fulltrain-e100-lr5e4-brev-v1-eval-pck005.json",
  ),
};

const focusLabelsPath = path.join(
  root,
  "analysis/hand-tracking-recording-2026-06-01/mediapipe-offline-labels-focus-v1.json",
);
const focusDebugSummaryPath = path.join(
  root,
  "analysis/hand-tracking-recording-2026-06-01/fresh-debug-labeled-mediapipe-v1/summary.json",
);

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
    writeReceipt: argv.includes("--write-receipt"),
  };
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readProject(relPath) {
  return readFile(path.join(root, relPath));
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function rel(filePath) {
  const resolved = path.resolve(filePath);
  if (resolved.startsWith(`${root}${path.sep}`)) return path.relative(root, resolved);
  if (resolved.startsWith(`${sideRoot}${path.sep}`)) return path.relative(sideRoot, resolved);
  if (resolved.startsWith(`${webPreviewRoot}${path.sep}`)) {
    return path.join("..", "asl-pilot-web", path.relative(webPreviewRoot, resolved));
  }
  return resolved;
}

function metric(obj, keys) {
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object" || !(key in current)) return null;
    current = current[key];
  }
  return typeof current === "number" ? current : null;
}

function round(value) {
  return typeof value === "number" ? Number(value.toFixed(6)) : null;
}

function extractActivePrompt(goalText) {
  const match = goalText.match(/\*\*Active per-milestone prompt:\*\*\s+\[`([^`]+)`\]/);
  return match ? match[1] : null;
}

function addCheck(checks, blockers, id, passed, evidence, blocker) {
  checks.push({ id, status: passed ? "passed" : "failed", evidence });
  if (!passed) blockers.push(blocker ?? id);
}

function artifactRecord(filePath, purpose) {
  return {
    path: rel(filePath),
    exists: exists(filePath),
    sha256: exists(filePath) ? sha256(filePath) : null,
    purpose,
  };
}

function generatedJsonArtifactRecord(filePath, value, purpose) {
  const generatedSha = value == null
    ? null
    : sha256Text(`${JSON.stringify(value, null, 2)}\n`);
  return {
    path: rel(filePath),
    exists: exists(filePath),
    sha256: generatedSha ?? (exists(filePath) ? sha256(filePath) : null),
    purpose,
  };
}

function refreshArtifactRecord(records, filePath) {
  const recordPath = rel(filePath);
  const index = records.findIndex((record) => record.path === recordPath);
  if (index === -1) return;
  records[index] = artifactRecord(filePath, records[index].purpose);
}

function gateResult(metricValue, op, threshold) {
  if (typeof metricValue !== "number") return false;
  if (op === ">=") return metricValue >= threshold;
  if (op === "<=") return metricValue <= threshold;
  throw new Error(`unknown gate op ${op}`);
}

function average(values) {
  const numeric = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  if (numeric.length === 0) return null;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function summarizeFocusDebug(summary) {
  if (!summary || !Array.isArray(summary.summaries)) return null;
  const labeled = summary.summaries.filter((entry) => entry.labelQuality);
  const worst = [...labeled]
    .sort((a, b) => (a.labelQuality?.meanBestIou ?? 1) - (b.labelQuality?.meanBestIou ?? 1))
    .slice(0, 5)
    .map((entry) => ({
      file: entry.file,
      expected_count: entry.labelQuality?.expectedCount ?? null,
      predicted_count: entry.labelQuality?.predictedCount ?? null,
      mean_best_iou: round(entry.labelQuality?.meanBestIou),
      recall_at_030: round(entry.labelQuality?.recallAt30),
      recall_at_050: round(entry.labelQuality?.recallAt50),
      soft_flags: entry.quality?.softFlags ?? [],
    }));
  return {
    frames_dir: summary.framesDir ?? null,
    out_dir: summary.outDir ?? null,
    frame_count: summary.frameCount ?? summary.summaries.length,
    labeled_frame_count: labeled.length,
    average_visual_score: round(summary.averageScore),
    average_mean_best_iou: round(average(labeled.map((entry) => entry.labelQuality?.meanBestIou))),
    average_recall_at_030: round(average(labeled.map((entry) => entry.labelQuality?.recallAt30))),
    average_recall_at_050: round(average(labeled.map((entry) => entry.labelQuality?.recallAt50))),
    worst_labeled_frames: worst,
  };
}

function selectedPairMetrics(probe, splitName) {
  const selected = probe?.[splitName]?.selected ?? {};
  const oracle = probe?.[splitName]?.oracle ?? {};
  return {
    coverage: round(selected.coverage),
    distinct_assigned_coverage: round(selected.distinct_assigned_coverage),
    collapse_rate: round(selected.collapse_rate),
    same_prediction_coverage_count: selected.same_prediction_coverage_count ?? null,
    n: selected.n ?? null,
    oracle_coverage: round(oracle.coverage),
    oracle_distinct_assigned_coverage: round(oracle.distinct_assigned_coverage),
    oracle_collapse_rate: round(oracle.collapse_rate),
  };
}

function top2NmsBaselineMetrics(detector, detectorReceiptPath) {
  const realEval = detector.real_twohand_eval ?? {};
  const selected = realEval.new ?? {};
  return {
    receipt: rel(detectorReceiptPath),
    head: detector.head ?? null,
    mode: detector.mode ?? null,
    weights: detector.weights ?? null,
    decode_nms_iou: realEval.decode_nms_iou ?? null,
    coverage_iou: realEval.coverage_iou ?? null,
    n_real_twohand: realEval.n_real_twohand ?? selected.n ?? null,
    coverage: round(selected.coverage),
    distinct_assigned_coverage: round(selected.distinct_assigned_coverage),
    collapse_rate: round(selected.collapse_rate),
    decoded_two_distinct: round(selected.decoded_two_distinct),
    same_prediction_coverage_count: selected.same_prediction_coverage_count ?? null,
    coverage_failure_count: selected.coverage_failure_count ?? null,
    distinct_assignment_failure_count: selected.distinct_assignment_failure_count ?? null,
    source_note:
      "Existing eval-only owned detector receipt; no training, checkpoint write, browser export, Brev lifecycle action, pretrained runtime dependency, or raw learner video upload.",
  };
}

function pairDistinctPass(evalSummary, coverageIou) {
  return typeof evalSummary?.distinct_score === "number" && evalSummary.distinct_score > coverageIou;
}

function pairCoveragePass(evalSummary, coverageIou) {
  if (!Array.isArray(evalSummary?.best_gt_iou) || evalSummary.best_gt_iou.length < 2) {
    return false;
  }
  return Math.min(...evalSummary.best_gt_iou) > coverageIou;
}

function deterministicPostfilterCeilingMetrics(audit, auditPath) {
  if (!audit?.schema_version || !Array.isArray(audit.failure_rows)) return null;
  const coverageIou = audit.params?.coverage_iou ?? 0.3;
  const selectedMetrics = audit.metrics?.selected ?? {};
  const oracleMetrics = audit.metrics?.oracle ?? {};
  const summary = audit.summary ?? {};
  const rows = audit.failure_rows;
  const n = selectedMetrics.n ?? summary.selected_pass_count + rows.length;
  const selectedDistinctPasses = summary.selected_pass_count
    ?? Math.round((selectedMetrics.distinct_assigned_coverage ?? 0) * n);
  const selectedCoveragePasses = typeof selectedMetrics.coverage_failure_count === "number"
    ? n - selectedMetrics.coverage_failure_count
    : Math.round((selectedMetrics.coverage ?? 0) * n);
  const filterSpecs = [
    {
      id: "min_box_size_floor",
      tag: "selected_subbox_too_small",
      directive_failure_mode: "min-box-size floor",
    },
    {
      id: "same_gt_slot_rejection",
      tag: "same_gt_slot_selected",
      directive_failure_mode: "spatial-separation / same-GT-slot rejection",
    },
    {
      id: "quality_false_positive_threshold",
      tag: "quality_false_positive",
      directive_failure_mode: "quality threshold",
    },
    {
      id: "hard_negative_rejection",
      tag: "selected_hard_negative_candidate",
      directive_failure_mode: "hard-negative threshold",
    },
  ];
  const perFilter = Object.fromEntries(
    filterSpecs.map((spec) => [
      spec.id,
      {
        tag: spec.tag,
        directive_failure_mode: spec.directive_failure_mode,
        flagged_rows: 0,
        oracle_distinct_pass_rows: 0,
        oracle_coverage_pass_rows: 0,
        selected_coverage_pass_rows: 0,
      },
    ]),
  );
  const namedFilterFlaggedRows = [];
  const unflaggedOracleCompatibleRows = [];
  const namedFilterOracleMissRows = [];
  for (const row of rows) {
    const tags = new Set(row.tags ?? []);
    const matchedSpecs = filterSpecs.filter((spec) => tags.has(spec.tag));
    const oracleDistinctPass = pairDistinctPass(row.oracle_eval, coverageIou);
    const oracleCoveragePass = pairCoveragePass(row.oracle_eval, coverageIou);
    const selectedCoveragePass = pairCoveragePass(row.selected_eval, coverageIou);
    for (const spec of matchedSpecs) {
      perFilter[spec.id].flagged_rows += 1;
      if (oracleDistinctPass) perFilter[spec.id].oracle_distinct_pass_rows += 1;
      if (oracleCoveragePass) perFilter[spec.id].oracle_coverage_pass_rows += 1;
      if (selectedCoveragePass) perFilter[spec.id].selected_coverage_pass_rows += 1;
    }
    if (matchedSpecs.length > 0) {
      namedFilterFlaggedRows.push({
        source_index: row.source_index,
        tags: row.tags ?? [],
        oracle_distinct_pass: oracleDistinctPass,
        oracle_coverage_pass: oracleCoveragePass,
        selected_coverage_pass: selectedCoveragePass,
      });
      if (!oracleDistinctPass) {
        namedFilterOracleMissRows.push({
          source_index: row.source_index,
          tags: row.tags ?? [],
          oracle_distinct_score: round(row.oracle_eval?.distinct_score),
        });
      }
    } else if (oracleDistinctPass) {
      unflaggedOracleCompatibleRows.push({
        source_index: row.source_index,
        tags: row.tags ?? [],
        oracle_distinct_score: round(row.oracle_eval?.distinct_score),
      });
    }
  }
  const recoverableDistinctRows = namedFilterFlaggedRows.filter((row) => row.oracle_distinct_pass);
  const recoverableCoverageFailures = namedFilterFlaggedRows.filter(
    (row) => !row.selected_coverage_pass && row.oracle_coverage_pass,
  );
  const postfilterDistinctPasses = selectedDistinctPasses + recoverableDistinctRows.length;
  const postfilterCoveragePasses = selectedCoveragePasses + recoverableCoverageFailures.length;
  const distinctGatePass = postfilterDistinctPasses / n >= 0.98;
  const coverageGatePass = postfilterCoveragePasses / n >= 0.98;
  const optionalLowTargetRows = rows.filter((row) => {
    const tags = new Set(row.tags ?? []);
    return tags.has("selected_low_target_candidate")
      && !filterSpecs.some((spec) => tags.has(spec.tag))
      && pairDistinctPass(row.oracle_eval, coverageIou);
  });
  return {
    receipt: rel(auditPath),
    method: "audit_tag_oracle_fallback_ceiling_not_runtime_selector",
    source_scope: "84 real two-hand rows from the candidate-selection failure audit; no training and no new checkpoint.",
    filter_tags: filterSpecs,
    source_metrics: {
      selected: {
        coverage: round(selectedMetrics.coverage),
        distinct_assigned_coverage: round(selectedMetrics.distinct_assigned_coverage),
        collapse_rate: round(selectedMetrics.collapse_rate),
        selected_distinct_pass_rows: selectedDistinctPasses,
        selected_coverage_pass_rows: selectedCoveragePasses,
        failure_rows: rows.length,
      },
      oracle: {
        coverage: round(oracleMetrics.coverage),
        distinct_assigned_coverage: round(oracleMetrics.distinct_assigned_coverage),
        collapse_rate: round(oracleMetrics.collapse_rate),
        oracle_pass_selected_fail_rows: summary.oracle_pass_selected_fail_count ?? null,
        oracle_fail_rows: summary.oracle_fail_count ?? null,
      },
      tag_counts: summary.tag_counts ?? null,
    },
    per_filter: perFilter,
    union: {
      named_filter_flagged_rows: namedFilterFlaggedRows.length,
      named_filter_oracle_distinct_pass_rows: recoverableDistinctRows.length,
      named_filter_oracle_coverage_recovered_rows: recoverableCoverageFailures.length,
      unflagged_oracle_compatible_rows: unflaggedOracleCompatibleRows,
      named_filter_oracle_miss_rows: namedFilterOracleMissRows,
    },
    postfilter_ceiling: {
      coverage: round(postfilterCoveragePasses / n),
      coverage_pass_rows: postfilterCoveragePasses,
      coverage_gate_pass: coverageGatePass,
      distinct_assigned_coverage: round(postfilterDistinctPasses / n),
      distinct_pass_rows: postfilterDistinctPasses,
      distinct_gate_pass: distinctGatePass,
      collapse_rate: round(selectedMetrics.collapse_rate),
      unrecovered_distinct_failure_rows: n - postfilterDistinctPasses,
      gate_status: distinctGatePass && coverageGatePass
        ? "passes_named_filter_ceiling"
        : "still_below_distinct_gate_under_named_filter_ceiling",
    },
    optional_low_target_extension: {
      tag: "selected_low_target_candidate",
      oracle_compatible_unflagged_rows: optionalLowTargetRows.map((row) => ({
        source_index: row.source_index,
        tags: row.tags ?? [],
        oracle_distinct_score: round(row.oracle_eval?.distinct_score),
      })),
      ceiling_if_added_to_filter_set: {
        distinct_assigned_coverage: round(
          (postfilterDistinctPasses + optionalLowTargetRows.length) / n,
        ),
        distinct_pass_rows: postfilterDistinctPasses + optionalLowTargetRows.length,
      },
      interpretation:
        "One remaining oracle-compatible selected failure is tagged only as selected_low_target_candidate. A future concrete post-filter needs a runtime-available proxy before treating this as a real filter, but it explains why the named directive filters alone stop just short of 0.98.",
    },
    interpretation:
      "The named deterministic failure-mode filters recover nearly all selector failures in the audit-tag oracle-fallback ceiling and make coverage pass 0.98, but distinct L/R assignment remains 82/84 = 0.976190, just below the current 0.98 gate. This is a ceiling measurement, not a shipped runtime selector.",
  };
}

function browserProductRequirementEvidence(paths) {
  const allExist = Object.values(paths).every((filePath) => exists(filePath));
  if (!allExist) return null;
  const liveTracker = readFile(paths.liveTracker);
  const practiceApp = readFile(paths.practiceApp);
  const lessonApp = readFile(paths.lessonApp);
  const passFailDecision = readFile(paths.passFailDecision);
  const clientModel = readFile(paths.clientModel);
  const bundle = readJson(paths.browserModelBundle);
  const practiceUsesRawFrameRecognizer =
    practiceApp.includes("camera.sampleFrames")
    && practiceApp.includes("browserInferenceEngine.predict(loaded, frames)")
    && practiceApp.includes("decide({")
    && passFailDecision.includes("frames: FrameSample[]")
    && clientModel.includes("export function sampleVideoFrame");
  const practicePassFailConsumesTracker =
    practiceApp.includes("useLiveTracker")
    || practiceApp.includes("detector0_tracking")
    || passFailDecision.includes("Detector0")
    || passFailDecision.includes("hand_0")
    || passFailDecision.includes("left_or_first_hand")
    || clientModel.includes("detector0_tracking");
  const liveTrackerUsesAnonymousSlots =
    liveTracker.includes('export const HANDS = ["hand_0", "hand_1"] as const');
  const liveTrackerUsesAnatomicalSlots =
    liveTracker.includes("left_or_first_hand") || liveTracker.includes("right_or_second_hand");
  const liveTrackerSortsByX =
    liveTracker.includes("visibleTracks.sort((a, b)") && liveTracker.includes("return ac - bc");
  const liveTrackerKeepsTwoNonduplicateTracks =
    liveTracker.includes("suppressDuplicateHandTracks")
    && liveTracker.includes("if (kept.length === HANDS.length) break")
    && liveTracker.includes("if (picked.length === HANDS.length) break");
  const lessonTrackerIsPreviewOnly =
    lessonApp.includes("trackingPreview")
    && lessonApp.includes("Demonstration only")
    && lessonApp.includes("not a pass/fail gate");
  const currentActiveRecognizerRequiresDistinctLR =
    bundle.recognition?.enabled === true && practicePassFailConsumesTracker;
  return {
    source: "current browser code in sibling asl-pilot-web checkout; read-only evidence",
    files: {
      live_tracker: rel(paths.liveTracker),
      practice_app: rel(paths.practiceApp),
      lesson_app: rel(paths.lessonApp),
      pass_fail_decision: rel(paths.passFailDecision),
      client_model: rel(paths.clientModel),
      browser_model_bundle: rel(paths.browserModelBundle),
    },
    browser_bundle: {
      recognition_enabled: bundle.recognition?.enabled ?? null,
      recognition_model_status: bundle.recognition?.model_status ?? null,
      detector0_tracking_enabled: bundle.detector0_tracking?.enabled ?? null,
      detector0_promotion_state: bundle.detector0_tracking?.promotion_state ?? null,
      box_driven_avatar_enabled: bundle.box_driven_avatar?.enabled ?? null,
      box_driven_avatar_requires_detector0_tracking:
        bundle.box_driven_avatar?.requires_detector0_tracking ?? null,
    },
    current_practice_pass_fail_path: {
      uses_raw_frame_samples: practiceUsesRawFrameRecognizer,
      consumes_detector0_or_hand_slots: practicePassFailConsumesTracker,
      distinct_lr_assignment_required: currentActiveRecognizerRequiresDistinctLR,
      interpretation:
        "Current practice pass/fail is raw-frame/model-card based and fail-closed; it does not consume Detector0 hand slots or anatomical L/R assignment.",
    },
    live_tracking_preview_path: {
      enabled_as_pass_fail_gate: false,
      preview_only_evidence: lessonTrackerIsPreviewOnly,
      hand_slot_names: liveTrackerUsesAnonymousSlots ? ["hand_0", "hand_1"] : [],
      uses_anatomical_lr_slot_names: liveTrackerUsesAnatomicalSlots,
      sorts_visible_tracks_left_to_right_for_display: liveTrackerSortsByX,
      keeps_two_nonduplicate_tracks: liveTrackerKeepsTwoNonduplicateTracks,
      distinct_lr_assignment_required: false,
      interpretation:
        "The live tracker preview emits two anonymous display tracks ordered left-to-right after duplicate suppression; it does not expose anatomical left/right as a pass/fail requirement.",
    },
    product_gate_answer: {
      current_repo_requirement_proven: true,
      distinct_lr_assignment_required_by_current_active_recognizer: false,
      two_non_collapsed_boxes_sufficient_for_current_preview_tracker: true,
      human_gate_reframe_flag: true,
      limitation:
        "This answers the current browser code path, not a future promoted tracker or sign recognizer contract. Stable slot identity remains a future tracking gate if that future consumer requires it.",
    },
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const checks = [];
  const blockers = [];

  const goalPath = path.join(root, "GOAL.md");
  const promptPath = path.join(root, activePromptPath);
  const architectureFilePath = path.join(root, architecturePath);
  const computePolicyReceiptFilePath = path.join(root, computePolicyReceiptPath);
  const pairRankObjectiveReceiptFilePath = path.join(root, pairRankObjectiveReceiptPath);
  const pairMarginSelectorRepairReceiptFilePath = path.join(root, pairMarginSelectorRepairReceiptPath);
  const directPairScorerReceiptFilePath = path.join(root, directPairScorerReceiptPath);
  const assignmentHeadRepairReceiptFilePath = path.join(root, assignmentHeadRepairReceiptPath);
  const focusedSliverRepairReceiptFilePath = path.join(root, focusedSliverRepairReceiptPath);
  const pairRankerCalibrationAuditReceiptFilePath = path.join(
    root,
    pairRankerCalibrationAuditReceiptPath,
  );
  const directPairMarginObjectiveReceiptFilePath = path.join(
    root,
    directPairMarginObjectiveReceiptPath,
  );
  const frameEdgeDispositionManifestFilePath = path.join(
    root,
    frameEdgeDispositionManifestPath,
  );
  const frameEdgeExclusionSeedFilePath = path.join(root, frameEdgeExclusionSeedPath);
  const clearerSourceReviewSubsetFilePath = path.join(root, clearerSourceReviewSubsetPath);
  const clearerSourceReviewOutcomesFilePath = path.join(root, clearerSourceReviewOutcomesPath);
  const clearerSourceReviewPacketFilePath = path.join(root, clearerSourceReviewPacketPath);
  const landmarkCacheRebuildEvalReceiptFilePath = path.join(
    root,
    landmarkCacheRebuildEvalReceiptPath,
  );
  const landmarkRetrainBrevPlanReceiptFilePath = path.join(
    root,
    landmarkRetrainBrevPlanReceiptPath,
  );
  const landmarkRetrainBrevRunReceiptFilePath = path.join(
    root,
    landmarkRetrainBrevRunReceiptPath,
  );
  const landmarkRetrainRegressionPivotReceiptFilePath = path.join(
    root,
    landmarkRetrainRegressionPivotReceiptPath,
  );
  const landmarkPckCampaignResearchPlanReceiptFilePath = path.join(
    root,
    landmarkPckCampaignResearchPlanReceiptPath,
  );
  const landmarkPckCampaignRun1ReceiptFilePath = path.join(
    root,
    landmarkPckCampaignRun1ReceiptPath,
  );
  const landmarkPckCampaignRun2ReceiptFilePath = path.join(
    root,
    landmarkPckCampaignRun2ReceiptPath,
  );
  const landmarkPckCampaignRun3ReceiptFilePath = path.join(
    root,
    landmarkPckCampaignRun3ReceiptPath,
  );
  const landmarkPckResearchRefreshAfterRun3ReceiptFilePath = path.join(
    root,
    landmarkPckResearchRefreshAfterRun3ReceiptPath,
  );
  const landmarkPckResunetArchitecturePreflightReceiptFilePath = path.join(
    root,
    landmarkPckResunetArchitecturePreflightReceiptPath,
  );
  const recognizerSchedulerPreflightReceiptFilePath = path.join(
    root,
    recognizerSchedulerPreflightReceiptPath,
  );
  const recognizerRun3SchedulerFulltrainReceiptFilePath = path.join(
    root,
    recognizerRun3SchedulerFulltrainReceiptPath,
  );
  const recognizerRun3ResearchTuningReceiptFilePath = path.join(
    root,
    recognizerRun3ResearchTuningReceiptPath,
  );
  const recognizerT32CacheLoaderPreflightReceiptFilePath = path.join(
    root,
    recognizerT32CacheLoaderPreflightReceiptPath,
  );
  const recognizerT32CacheSmokeValidateReceiptFilePath = path.join(
    root,
    recognizerT32CacheSmokeValidateReceiptPath,
  );
  const recognizerT32FullCacheValidateReceiptFilePath = path.join(
    root,
    recognizerT32FullCacheValidateReceiptPath,
  );
  const recognizerRun4T32PreflightBlockerReceiptFilePath = path.join(
    root,
    recognizerRun4T32PreflightBlockerReceiptPath,
  );
  const recognizerRun4T32HealthRefreshReceiptFilePath = path.join(
    root,
    recognizerRun4T32HealthRefreshReceiptPath,
  );
  const recognizerRun4T32FulltrainReceiptFilePath = path.join(
    root,
    recognizerRun4T32FulltrainReceiptPath,
  );
  const recognizerRun4ResearchTuningReceiptFilePath = path.join(
    root,
    recognizerRun4ResearchTuningReceiptPath,
  );
  const recognizerRun5SupconPreflightReceiptFilePath = path.join(
    root,
    recognizerRun5SupconPreflightReceiptPath,
  );
  const recognizerRun5SupconFulltrainReceiptFilePath = path.join(
    root,
    recognizerRun5SupconFulltrainReceiptPath,
  );
  const recognizerRun5ResearchTuningReceiptFilePath = path.join(
    root,
    recognizerRun5ResearchTuningReceiptPath,
  );
  const recognizerRun6VerificationMarginPreflightReceiptFilePath = path.join(
    root,
    recognizerRun6VerificationMarginPreflightReceiptPath,
  );
  const recognizerRun6T32PreflightBlockerReceiptFilePath = path.join(
    root,
    recognizerRun6T32PreflightBlockerReceiptPath,
  );
  const recognizerRun6VerifselectFulltrainReceiptFilePath = path.join(
    root,
    recognizerRun6VerifselectFulltrainReceiptPath,
  );
  const recognizerRun6ResearchTuningReceiptFilePath = path.join(
    root,
    recognizerRun6ResearchTuningReceiptPath,
  );
  const recognizerRun7VerificationTailAuditReceiptFilePath = path.join(
    root,
    recognizerRun7VerificationTailAuditReceiptPath,
  );
  const recognizerRun7HardNegativeObjectiveResearchReceiptFilePath = path.join(
    root,
    recognizerRun7HardNegativeObjectiveResearchReceiptPath,
  );
  const recognizerRun7OvrBceHardnegPreflightReceiptFilePath = path.join(
    root,
    recognizerRun7OvrBceHardnegPreflightReceiptPath,
  );
  const recognizerRun7OvrBceHardnegFulltrainReceiptFilePath = path.join(
    root,
    recognizerRun7OvrBceHardnegFulltrainReceiptPath,
  );
  const recognizerRun7OvrBceResearchTuningReceiptFilePath = path.join(
    root,
    recognizerRun7OvrBceResearchTuningReceiptPath,
  );
  const recognizerRun6VsRun7CalibrationAuditReceiptFilePath = path.join(
    root,
    recognizerRun6VsRun7CalibrationAuditReceiptPath,
  );
  const recognizerRun7TestRecallReproductionDiscrepancyReceiptFilePath = path.join(
    root,
    recognizerRun7TestRecallReproductionDiscrepancyReceiptPath,
  );
  const recognizerRun8OvrBceW001PreflightReceiptFilePath = path.join(
    root,
    recognizerRun8OvrBceW001PreflightReceiptPath,
  );
  const recognizerRun8OvrBceW001PreflightBlockerReceiptFilePath = path.join(
    root,
    recognizerRun8OvrBceW001PreflightBlockerReceiptPath,
  );
  const recognizerRun8OvrBceW001FulltrainReceiptFilePath = path.join(
    root,
    recognizerRun8OvrBceW001FulltrainReceiptPath,
  );
  const recognizerRun8OvrBceW001ResearchTuningReceiptFilePath = path.join(
    root,
    recognizerRun8OvrBceW001ResearchTuningReceiptPath,
  );
  const recognizerRun6Run7Run8CalibrationTailAuditReceiptFilePath = path.join(
    root,
    recognizerRun6Run7Run8CalibrationTailAuditReceiptPath,
  );
  const recognizerPostOvrBceCalibrationSafeResearchReceiptFilePath = path.join(
    root,
    recognizerPostOvrBceCalibrationSafeResearchReceiptPath,
  );
  const recognizerRun6MonitorSelectionStabilityPreflightReceiptFilePath = path.join(
    root,
    recognizerRun6MonitorSelectionStabilityPreflightReceiptPath,
  );
  const recognizerCandidateCheckpointRetentionPreflightReceiptFilePath = path.join(
    root,
    recognizerCandidateCheckpointRetentionPreflightReceiptPath,
  );
  const recognizerRetentionEnabledResearchTuningReceiptFilePath = path.join(
    root,
    recognizerRetentionEnabledResearchTuningReceiptPath,
  );
  const recognizerRun9RetentionEnabledRun6RecipePreflightReceiptFilePath = path.join(
    root,
    recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath,
  );
  const recognizerRun9BrevAuthVisibilityRefreshReceiptFilePath = path.join(
    root,
    recognizerRun9BrevAuthVisibilityRefreshReceiptPath,
  );
  const recognizerRun9BrevAuthVisibilityRetryReceiptFilePath = path.join(
    root,
    recognizerRun9BrevAuthVisibilityRetryReceiptPath,
  );
  const recognizerRun9BrevAuthHumanLoginBoundaryReceiptFilePath = path.join(
    root,
    recognizerRun9BrevAuthHumanLoginBoundaryReceiptPath,
  );
  const recognizerRun6VsRun7CalibrationDetailedReceiptFilePath = path.join(
    root,
    recognizerRun6VsRun7CalibrationDetailedReceiptPath,
  );
  const recognizerRun6Run7Run8CalibrationTailDetailedReceiptFilePath = path.join(
    root,
    recognizerRun6Run7Run8CalibrationTailDetailedReceiptPath,
  );
  const recognizerRun6MonitorSelectionStabilityDetailedReceiptFilePath = path.join(
    root,
    recognizerRun6MonitorSelectionStabilityDetailedReceiptPath,
  );
  const recognizerCandidateCheckpointRetentionDryrunReceiptFilePath = path.join(
    root,
    recognizerCandidateCheckpointRetentionDryrunReceiptPath,
  );
  const recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptFilePath = path.join(
    root,
    recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath,
  );
  const recognizerRetentionEnabledResearchTuningPromptFilePath = path.join(
    root,
    recognizerRetentionEnabledResearchTuningPromptPath,
  );
  const recognizerRetentionEnabledResearchTuningRequestFilePath = path.join(
    root,
    recognizerRetentionEnabledResearchTuningRequestPath,
  );
  const recognizerRetentionEnabledResearchTuningRawFilePath = path.join(
    root,
    recognizerRetentionEnabledResearchTuningRawPath,
  );
  const recognizerRetentionEnabledResearchTuningResponseFilePath = path.join(
    root,
    recognizerRetentionEnabledResearchTuningResponsePath,
  );
  const recognizerRun7OvrBceResearchTuningPromptFilePath = path.join(
    root,
    recognizerRun7OvrBceResearchTuningPromptPath,
  );
  const recognizerRun7OvrBceResearchTuningRequestFilePath = path.join(
    root,
    recognizerRun7OvrBceResearchTuningRequestPath,
  );
  const recognizerRun7OvrBceResearchTuningRawFilePath = path.join(
    root,
    recognizerRun7OvrBceResearchTuningRawPath,
  );
  const recognizerRun7OvrBceResearchTuningResponseFilePath = path.join(
    root,
    recognizerRun7OvrBceResearchTuningResponsePath,
  );
  const recognizerRun8OvrBceW001ResearchTuningPromptFilePath = path.join(
    root,
    recognizerRun8OvrBceW001ResearchTuningPromptPath,
  );
  const recognizerRun8OvrBceW001ResearchTuningRequestFilePath = path.join(
    root,
    recognizerRun8OvrBceW001ResearchTuningRequestPath,
  );
  const recognizerRun8OvrBceW001ResearchTuningRawFilePath = path.join(
    root,
    recognizerRun8OvrBceW001ResearchTuningRawPath,
  );
  const recognizerRun8OvrBceW001ResearchTuningResponseFilePath = path.join(
    root,
    recognizerRun8OvrBceW001ResearchTuningResponsePath,
  );
  const recognizerPostOvrBceCalibrationSafeResearchPromptFilePath = path.join(
    root,
    recognizerPostOvrBceCalibrationSafeResearchPromptPath,
  );
  const recognizerPostOvrBceCalibrationSafeResearchRequestFilePath = path.join(
    root,
    recognizerPostOvrBceCalibrationSafeResearchRequestPath,
  );
  const recognizerPostOvrBceCalibrationSafeResearchRawFilePath = path.join(
    root,
    recognizerPostOvrBceCalibrationSafeResearchRawPath,
  );
  const recognizerPostOvrBceCalibrationSafeResearchResponseFilePath = path.join(
    root,
    recognizerPostOvrBceCalibrationSafeResearchResponsePath,
  );
  const recognizerRun6VerificationMarginDiagnosticReceiptFilePath = path.join(
    root,
    recognizerRun6VerificationMarginDiagnosticReceiptPath,
  );
  const recognizerRun6VerifselectDryrunReceiptFilePath = path.join(
    root,
    recognizerRun6VerifselectDryrunReceiptPath,
  );
  const recognizerRun7VerificationTailDiagnosticReceiptFilePath = path.join(
    root,
    recognizerRun7VerificationTailDiagnosticReceiptPath,
  );
  const recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptFilePath = path.join(
    root,
    recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptPath,
  );
  const recognizerRun7OvrBceHardnegWeight003DryrunReceiptFilePath = path.join(
    root,
    recognizerRun7OvrBceHardnegWeight003DryrunReceiptPath,
  );
  const recognizerRun8OvrBceW001DryrunReceiptFilePath = path.join(
    root,
    recognizerRun8OvrBceW001DryrunReceiptPath,
  );
  const recognizerRun3ResearchTuningPromptFilePath = path.join(
    root,
    recognizerRun3ResearchTuningPromptPath,
  );
  const recognizerRun3ResearchTuningRequestFilePath = path.join(
    root,
    recognizerRun3ResearchTuningRequestPath,
  );
  const recognizerRun3ResearchTuningRawFilePath = path.join(
    root,
    recognizerRun3ResearchTuningRawPath,
  );
  const recognizerRun3ResearchTuningResponseFilePath = path.join(
    root,
    recognizerRun3ResearchTuningResponsePath,
  );
  const recognizerRun4ResearchTuningPromptFilePath = path.join(
    root,
    recognizerRun4ResearchTuningPromptPath,
  );
  const recognizerRun4ResearchTuningRequestFilePath = path.join(
    root,
    recognizerRun4ResearchTuningRequestPath,
  );
  const recognizerRun4ResearchTuningRawFilePath = path.join(
    root,
    recognizerRun4ResearchTuningRawPath,
  );
  const recognizerRun4ResearchTuningResponseFilePath = path.join(
    root,
    recognizerRun4ResearchTuningResponsePath,
  );
  const recognizerRun5ResearchTuningPromptFilePath = path.join(
    root,
    recognizerRun5ResearchTuningPromptPath,
  );
  const recognizerRun5ResearchTuningRequestFilePath = path.join(
    root,
    recognizerRun5ResearchTuningRequestPath,
  );
  const recognizerRun5ResearchTuningRawFilePath = path.join(
    root,
    recognizerRun5ResearchTuningRawPath,
  );
  const recognizerRun5ResearchTuningResponseFilePath = path.join(
    root,
    recognizerRun5ResearchTuningResponsePath,
  );
  const recognizerRun6ResearchTuningPromptFilePath = path.join(
    root,
    recognizerRun6ResearchTuningPromptPath,
  );
  const recognizerRun6ResearchTuningRequestFilePath = path.join(
    root,
    recognizerRun6ResearchTuningRequestPath,
  );
  const recognizerRun6ResearchTuningRawFilePath = path.join(
    root,
    recognizerRun6ResearchTuningRawPath,
  );
  const recognizerRun6ResearchTuningResponseFilePath = path.join(
    root,
    recognizerRun6ResearchTuningResponsePath,
  );
  const recognizerRun7HardNegativeObjectiveResearchPromptFilePath = path.join(
    root,
    recognizerRun7HardNegativeObjectiveResearchPromptPath,
  );
  const recognizerRun7HardNegativeObjectiveResearchRequestFilePath = path.join(
    root,
    recognizerRun7HardNegativeObjectiveResearchRequestPath,
  );
  const recognizerRun7HardNegativeObjectiveResearchRawFilePath = path.join(
    root,
    recognizerRun7HardNegativeObjectiveResearchRawPath,
  );
  const recognizerRun7HardNegativeObjectiveResearchResponseFilePath = path.join(
    root,
    recognizerRun7HardNegativeObjectiveResearchResponsePath,
  );
  const recognizerSchedulerTinyOverfitReceiptFilePath = path.join(
    root,
    recognizerSchedulerTinyOverfitReceiptPath,
  );
  const recognizerSchedulerFullDataSmokeReceiptFilePath = path.join(
    root,
    recognizerSchedulerFullDataSmokeReceiptPath,
  );
  const recognizerT32LoaderDryrunReceiptFilePath = path.join(
    root,
    recognizerT32LoaderDryrunReceiptPath,
  );
  const recognizerT32CacheSmokeDryrunReceiptFilePath = path.join(
    root,
    recognizerT32CacheSmokeDryrunReceiptPath,
  );
  const recognizerT32FullCacheDryrunReceiptFilePath = path.join(
    root,
    recognizerT32FullCacheDryrunReceiptPath,
  );
  const recognizerRun5SupconZeroWeightDryrunReceiptFilePath = path.join(
    root,
    recognizerRun5SupconZeroWeightDryrunReceiptPath,
  );
  const recognizerRun5SupconWeight005DryrunReceiptFilePath = path.join(
    root,
    recognizerRun5SupconWeight005DryrunReceiptPath,
  );
  const landmarkRetrainLocalPreflightReceiptFilePath = path.join(
    root,
    landmarkRetrainLocalPreflightReceiptPath,
  );
  const brevReadinessRefreshReceiptFilePath = path.join(
    root,
    brevReadinessRefreshReceiptPath,
  );
  const brevApprovalRequestReceiptFilePath = path.join(
    root,
    brevApprovalRequestReceiptPath,
  );
  const brevApprovalBlockerReceiptFilePath = path.join(
    root,
    brevApprovalBlockerReceiptPath,
  );
  const codexSupervisorDryRunReceiptFilePath = path.join(
    root,
    codexSupervisorDryRunReceiptPath,
  );
  const codexBothDryRunReceiptFilePath = path.join(
    root,
    codexBothDryRunReceiptPath,
  );
  const bundlePath = path.join(root, "web/public/model/browser-model-bundle.json");
  const detectorCardPath = path.join(root, "web/public/model/detector0-card.json");

  addCheck(checks, blockers, "goal_exists", exists(goalPath), { path: "GOAL.md" }, "GOAL.md is missing");
  addCheck(
    checks,
    blockers,
    "m3jb_prompt_exists",
    exists(promptPath),
    { path: activePromptPath },
    `${activePromptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "architecture_exists",
    exists(architectureFilePath),
    { path: architecturePath },
    `${architecturePath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "brev_compute_policy_receipt_exists",
    exists(computePolicyReceiptFilePath),
    { path: computePolicyReceiptPath },
    `${computePolicyReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "pairrank_selector_objective_receipt_exists",
    exists(pairRankObjectiveReceiptFilePath),
    { path: pairRankObjectiveReceiptPath },
    `${pairRankObjectiveReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "pairmargin_selector_repair_receipt_exists",
    exists(pairMarginSelectorRepairReceiptFilePath),
    { path: pairMarginSelectorRepairReceiptPath },
    `${pairMarginSelectorRepairReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "direct_pair_scorer_receipt_exists",
    exists(directPairScorerReceiptFilePath),
    { path: directPairScorerReceiptPath },
    `${directPairScorerReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "assignment_head_repair_receipt_exists",
    exists(assignmentHeadRepairReceiptFilePath),
    { path: assignmentHeadRepairReceiptPath },
    `${assignmentHeadRepairReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "focused_sliver_repair_receipt_exists",
    exists(focusedSliverRepairReceiptFilePath),
    { path: focusedSliverRepairReceiptPath },
    `${focusedSliverRepairReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "pair_ranker_calibration_audit_receipt_exists",
    exists(pairRankerCalibrationAuditReceiptFilePath),
    { path: pairRankerCalibrationAuditReceiptPath },
    `${pairRankerCalibrationAuditReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "direct_pair_margin_objective_receipt_exists",
    exists(directPairMarginObjectiveReceiptFilePath),
    { path: directPairMarginObjectiveReceiptPath },
    `${directPairMarginObjectiveReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_cache_rebuild_eval_receipt_exists",
    exists(landmarkCacheRebuildEvalReceiptFilePath),
    { path: landmarkCacheRebuildEvalReceiptPath },
    `${landmarkCacheRebuildEvalReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_retrain_brev_plan_receipt_exists",
    exists(landmarkRetrainBrevPlanReceiptFilePath),
    { path: landmarkRetrainBrevPlanReceiptPath },
    `${landmarkRetrainBrevPlanReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_retrain_brev_run_receipt_exists",
    exists(landmarkRetrainBrevRunReceiptFilePath),
    { path: landmarkRetrainBrevRunReceiptPath },
    `${landmarkRetrainBrevRunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_retrain_regression_pivot_receipt_exists",
    exists(landmarkRetrainRegressionPivotReceiptFilePath),
    { path: landmarkRetrainRegressionPivotReceiptPath },
    `${landmarkRetrainRegressionPivotReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_campaign_research_plan_receipt_exists",
    exists(landmarkPckCampaignResearchPlanReceiptFilePath),
    { path: landmarkPckCampaignResearchPlanReceiptPath },
    `${landmarkPckCampaignResearchPlanReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_campaign_run1_receipt_exists",
    exists(landmarkPckCampaignRun1ReceiptFilePath),
    { path: landmarkPckCampaignRun1ReceiptPath },
    `${landmarkPckCampaignRun1ReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_campaign_run2_receipt_exists",
    exists(landmarkPckCampaignRun2ReceiptFilePath),
    { path: landmarkPckCampaignRun2ReceiptPath },
    `${landmarkPckCampaignRun2ReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_campaign_run3_receipt_exists",
    exists(landmarkPckCampaignRun3ReceiptFilePath),
    { path: landmarkPckCampaignRun3ReceiptPath },
    `${landmarkPckCampaignRun3ReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_research_refresh_after_run3_receipt_exists",
    exists(landmarkPckResearchRefreshAfterRun3ReceiptFilePath),
    { path: landmarkPckResearchRefreshAfterRun3ReceiptPath },
    `${landmarkPckResearchRefreshAfterRun3ReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_resunet_architecture_preflight_receipt_exists",
    exists(landmarkPckResunetArchitecturePreflightReceiptFilePath),
    { path: landmarkPckResunetArchitecturePreflightReceiptPath },
    `${landmarkPckResunetArchitecturePreflightReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_scheduler_preflight_receipt_exists",
    exists(recognizerSchedulerPreflightReceiptFilePath),
    { path: recognizerSchedulerPreflightReceiptPath },
    `${recognizerSchedulerPreflightReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run3_scheduler_fulltrain_receipt_exists",
    exists(recognizerRun3SchedulerFulltrainReceiptFilePath),
    { path: recognizerRun3SchedulerFulltrainReceiptPath },
    `${recognizerRun3SchedulerFulltrainReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run3_research_tuning_receipt_exists",
    exists(recognizerRun3ResearchTuningReceiptFilePath),
    { path: recognizerRun3ResearchTuningReceiptPath },
    `${recognizerRun3ResearchTuningReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_t32_cache_loader_preflight_receipt_exists",
    exists(recognizerT32CacheLoaderPreflightReceiptFilePath),
    { path: recognizerT32CacheLoaderPreflightReceiptPath },
    `${recognizerT32CacheLoaderPreflightReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_t32_cache_smoke_validate_receipt_exists",
    exists(recognizerT32CacheSmokeValidateReceiptFilePath),
    { path: recognizerT32CacheSmokeValidateReceiptPath },
    `${recognizerT32CacheSmokeValidateReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_t32_full_cache_validate_receipt_exists",
    exists(recognizerT32FullCacheValidateReceiptFilePath),
    { path: recognizerT32FullCacheValidateReceiptPath },
    `${recognizerT32FullCacheValidateReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run4_t32_preflight_blocker_receipt_exists",
    exists(recognizerRun4T32PreflightBlockerReceiptFilePath),
    { path: recognizerRun4T32PreflightBlockerReceiptPath },
    `${recognizerRun4T32PreflightBlockerReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run4_t32_health_refresh_receipt_exists",
    exists(recognizerRun4T32HealthRefreshReceiptFilePath),
    { path: recognizerRun4T32HealthRefreshReceiptPath },
    `${recognizerRun4T32HealthRefreshReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run4_t32_fulltrain_receipt_exists",
    exists(recognizerRun4T32FulltrainReceiptFilePath),
    { path: recognizerRun4T32FulltrainReceiptPath },
    `${recognizerRun4T32FulltrainReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run4_research_tuning_receipt_exists",
    exists(recognizerRun4ResearchTuningReceiptFilePath),
    { path: recognizerRun4ResearchTuningReceiptPath },
    `${recognizerRun4ResearchTuningReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run5_supcon_preflight_receipt_exists",
    exists(recognizerRun5SupconPreflightReceiptFilePath),
    { path: recognizerRun5SupconPreflightReceiptPath },
    `${recognizerRun5SupconPreflightReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run5_supcon_fulltrain_receipt_exists",
    exists(recognizerRun5SupconFulltrainReceiptFilePath),
    { path: recognizerRun5SupconFulltrainReceiptPath },
    `${recognizerRun5SupconFulltrainReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run5_research_tuning_receipt_exists",
    exists(recognizerRun5ResearchTuningReceiptFilePath),
    { path: recognizerRun5ResearchTuningReceiptPath },
    `${recognizerRun5ResearchTuningReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_verification_margin_preflight_receipt_exists",
    exists(recognizerRun6VerificationMarginPreflightReceiptFilePath),
    { path: recognizerRun6VerificationMarginPreflightReceiptPath },
    `${recognizerRun6VerificationMarginPreflightReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_t32_preflight_blocker_receipt_exists",
    exists(recognizerRun6T32PreflightBlockerReceiptFilePath),
    { path: recognizerRun6T32PreflightBlockerReceiptPath },
    `${recognizerRun6T32PreflightBlockerReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_verifselect_fulltrain_receipt_exists",
    exists(recognizerRun6VerifselectFulltrainReceiptFilePath),
    { path: recognizerRun6VerifselectFulltrainReceiptPath },
    `${recognizerRun6VerifselectFulltrainReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_research_tuning_receipt_exists",
    exists(recognizerRun6ResearchTuningReceiptFilePath),
    { path: recognizerRun6ResearchTuningReceiptPath },
    `${recognizerRun6ResearchTuningReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_verification_tail_audit_receipt_exists",
    exists(recognizerRun7VerificationTailAuditReceiptFilePath),
    { path: recognizerRun7VerificationTailAuditReceiptPath },
    `${recognizerRun7VerificationTailAuditReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_hard_negative_objective_research_receipt_exists",
    exists(recognizerRun7HardNegativeObjectiveResearchReceiptFilePath),
    { path: recognizerRun7HardNegativeObjectiveResearchReceiptPath },
    `${recognizerRun7HardNegativeObjectiveResearchReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_ovr_bce_hardneg_preflight_receipt_exists",
    exists(recognizerRun7OvrBceHardnegPreflightReceiptFilePath),
    { path: recognizerRun7OvrBceHardnegPreflightReceiptPath },
    `${recognizerRun7OvrBceHardnegPreflightReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_ovr_bce_hardneg_fulltrain_receipt_exists",
    exists(recognizerRun7OvrBceHardnegFulltrainReceiptFilePath),
    { path: recognizerRun7OvrBceHardnegFulltrainReceiptPath },
    `${recognizerRun7OvrBceHardnegFulltrainReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_ovr_bce_research_tuning_receipt_exists",
    exists(recognizerRun7OvrBceResearchTuningReceiptFilePath),
    { path: recognizerRun7OvrBceResearchTuningReceiptPath },
    `${recognizerRun7OvrBceResearchTuningReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_vs_run7_paired_calibration_audit_receipts_exist",
    exists(recognizerRun6VsRun7CalibrationAuditReceiptFilePath)
      && exists(recognizerRun6VsRun7CalibrationDetailedReceiptFilePath),
    {
      summary_path: recognizerRun6VsRun7CalibrationAuditReceiptPath,
      detailed_path: recognizerRun6VsRun7CalibrationDetailedReceiptPath,
    },
    `${recognizerRun6VsRun7CalibrationAuditReceiptPath} or ${recognizerRun6VsRun7CalibrationDetailedReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_test_recall_reproduction_discrepancy_receipt_exists",
    exists(recognizerRun7TestRecallReproductionDiscrepancyReceiptFilePath),
    { path: recognizerRun7TestRecallReproductionDiscrepancyReceiptPath },
    `${recognizerRun7TestRecallReproductionDiscrepancyReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run8_ovr_bce_w001_preflight_receipts_exist",
    exists(recognizerRun8OvrBceW001PreflightReceiptFilePath)
      && exists(recognizerRun8OvrBceW001DryrunReceiptFilePath),
    {
      summary_path: recognizerRun8OvrBceW001PreflightReceiptPath,
      dryrun_path: recognizerRun8OvrBceW001DryrunReceiptPath,
    },
    `${recognizerRun8OvrBceW001PreflightReceiptPath} or ${recognizerRun8OvrBceW001DryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run8_ovr_bce_w001_brev_preflight_blocker_receipt_exists",
    exists(recognizerRun8OvrBceW001PreflightBlockerReceiptFilePath),
    { path: recognizerRun8OvrBceW001PreflightBlockerReceiptPath },
    `${recognizerRun8OvrBceW001PreflightBlockerReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run8_ovr_bce_w001_fulltrain_receipt_exists",
    exists(recognizerRun8OvrBceW001FulltrainReceiptFilePath),
    { path: recognizerRun8OvrBceW001FulltrainReceiptPath },
    `${recognizerRun8OvrBceW001FulltrainReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run8_ovr_bce_w001_research_tuning_receipt_exists",
    exists(recognizerRun8OvrBceW001ResearchTuningReceiptFilePath),
    { path: recognizerRun8OvrBceW001ResearchTuningReceiptPath },
    `${recognizerRun8OvrBceW001ResearchTuningReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_run7_run8_calibration_tail_audit_receipts_exist",
    exists(recognizerRun6Run7Run8CalibrationTailAuditReceiptFilePath)
      && exists(recognizerRun6Run7Run8CalibrationTailDetailedReceiptFilePath),
    {
      summary_path: recognizerRun6Run7Run8CalibrationTailAuditReceiptPath,
      detailed_path: recognizerRun6Run7Run8CalibrationTailDetailedReceiptPath,
    },
    `${recognizerRun6Run7Run8CalibrationTailAuditReceiptPath} or ${recognizerRun6Run7Run8CalibrationTailDetailedReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_post_ovr_bce_calibration_safe_research_receipt_exists",
    exists(recognizerPostOvrBceCalibrationSafeResearchReceiptFilePath),
    { path: recognizerPostOvrBceCalibrationSafeResearchReceiptPath },
    `${recognizerPostOvrBceCalibrationSafeResearchReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_monitor_selection_stability_preflight_receipts_exist",
    exists(recognizerRun6MonitorSelectionStabilityPreflightReceiptFilePath)
      && exists(recognizerRun6MonitorSelectionStabilityDetailedReceiptFilePath),
    {
      summary_path: recognizerRun6MonitorSelectionStabilityPreflightReceiptPath,
      detailed_path: recognizerRun6MonitorSelectionStabilityDetailedReceiptPath,
    },
    `${recognizerRun6MonitorSelectionStabilityPreflightReceiptPath} or ${recognizerRun6MonitorSelectionStabilityDetailedReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_candidate_checkpoint_retention_preflight_receipts_exist",
    exists(recognizerCandidateCheckpointRetentionPreflightReceiptFilePath)
      && exists(recognizerCandidateCheckpointRetentionDryrunReceiptFilePath),
    {
      summary_path: recognizerCandidateCheckpointRetentionPreflightReceiptPath,
      dryrun_path: recognizerCandidateCheckpointRetentionDryrunReceiptPath,
    },
    `${recognizerCandidateCheckpointRetentionPreflightReceiptPath} or ${recognizerCandidateCheckpointRetentionDryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_retention_enabled_research_tuning_receipt_exists",
    exists(recognizerRetentionEnabledResearchTuningReceiptFilePath),
    { path: recognizerRetentionEnabledResearchTuningReceiptPath },
    `${recognizerRetentionEnabledResearchTuningReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run9_retention_enabled_run6_recipe_preflight_receipts_exist",
    exists(recognizerRun9RetentionEnabledRun6RecipePreflightReceiptFilePath)
      && exists(recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptFilePath),
    {
      summary_path: recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath,
      dryrun_path: recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath,
    },
    `${recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath} or ${recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run9_brev_auth_visibility_refresh_receipt_exists",
    exists(recognizerRun9BrevAuthVisibilityRefreshReceiptFilePath),
    { path: recognizerRun9BrevAuthVisibilityRefreshReceiptPath },
    `${recognizerRun9BrevAuthVisibilityRefreshReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run9_brev_auth_visibility_retry_receipt_exists",
    exists(recognizerRun9BrevAuthVisibilityRetryReceiptFilePath),
    { path: recognizerRun9BrevAuthVisibilityRetryReceiptPath },
    `${recognizerRun9BrevAuthVisibilityRetryReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run9_brev_auth_human_login_boundary_receipt_exists",
    exists(recognizerRun9BrevAuthHumanLoginBoundaryReceiptFilePath),
    { path: recognizerRun9BrevAuthHumanLoginBoundaryReceiptPath },
    `${recognizerRun9BrevAuthHumanLoginBoundaryReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_scheduler_tiny_overfit_receipt_exists",
    exists(recognizerSchedulerTinyOverfitReceiptFilePath),
    { path: recognizerSchedulerTinyOverfitReceiptPath },
    `${recognizerSchedulerTinyOverfitReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_scheduler_full_data_smoke_receipt_exists",
    exists(recognizerSchedulerFullDataSmokeReceiptFilePath),
    { path: recognizerSchedulerFullDataSmokeReceiptPath },
    `${recognizerSchedulerFullDataSmokeReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_t32_loader_dryrun_receipt_exists",
    exists(recognizerT32LoaderDryrunReceiptFilePath),
    { path: recognizerT32LoaderDryrunReceiptPath },
    `${recognizerT32LoaderDryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_t32_cache_smoke_dryrun_receipt_exists",
    exists(recognizerT32CacheSmokeDryrunReceiptFilePath),
    { path: recognizerT32CacheSmokeDryrunReceiptPath },
    `${recognizerT32CacheSmokeDryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_t32_full_cache_dryrun_receipt_exists",
    exists(recognizerT32FullCacheDryrunReceiptFilePath),
    { path: recognizerT32FullCacheDryrunReceiptPath },
    `${recognizerT32FullCacheDryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run5_supcon_zero_weight_dryrun_receipt_exists",
    exists(recognizerRun5SupconZeroWeightDryrunReceiptFilePath),
    { path: recognizerRun5SupconZeroWeightDryrunReceiptPath },
    `${recognizerRun5SupconZeroWeightDryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run5_supcon_weight005_dryrun_receipt_exists",
    exists(recognizerRun5SupconWeight005DryrunReceiptFilePath),
    { path: recognizerRun5SupconWeight005DryrunReceiptPath },
    `${recognizerRun5SupconWeight005DryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_verification_margin_diagnostic_receipt_exists",
    exists(recognizerRun6VerificationMarginDiagnosticReceiptFilePath),
    { path: recognizerRun6VerificationMarginDiagnosticReceiptPath },
    `${recognizerRun6VerificationMarginDiagnosticReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_verifselect_dryrun_receipt_exists",
    exists(recognizerRun6VerifselectDryrunReceiptFilePath),
    { path: recognizerRun6VerifselectDryrunReceiptPath },
    `${recognizerRun6VerifselectDryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_verification_tail_diagnostic_receipt_exists",
    exists(recognizerRun7VerificationTailDiagnosticReceiptFilePath),
    { path: recognizerRun7VerificationTailDiagnosticReceiptPath },
    `${recognizerRun7VerificationTailDiagnosticReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_ovr_bce_zero_weight_dryrun_receipt_exists",
    exists(recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptFilePath),
    { path: recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptPath },
    `${recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_ovr_bce_weight003_dryrun_receipt_exists",
    exists(recognizerRun7OvrBceHardnegWeight003DryrunReceiptFilePath),
    { path: recognizerRun7OvrBceHardnegWeight003DryrunReceiptPath },
    `${recognizerRun7OvrBceHardnegWeight003DryrunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "landmark_retrain_local_preflight_receipt_exists",
    exists(landmarkRetrainLocalPreflightReceiptFilePath),
    { path: landmarkRetrainLocalPreflightReceiptPath },
    `${landmarkRetrainLocalPreflightReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "brev_readiness_refresh_receipt_exists",
    exists(brevReadinessRefreshReceiptFilePath),
    { path: brevReadinessRefreshReceiptPath },
    `${brevReadinessRefreshReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "brev_approval_request_receipt_exists",
    exists(brevApprovalRequestReceiptFilePath),
    { path: brevApprovalRequestReceiptPath },
    `${brevApprovalRequestReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "brev_approval_blocker_receipt_exists",
    exists(brevApprovalBlockerReceiptFilePath),
    { path: brevApprovalBlockerReceiptPath },
    `${brevApprovalBlockerReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "codex_supervisor_dry_run_receipt_exists",
    exists(codexSupervisorDryRunReceiptFilePath),
    { path: codexSupervisorDryRunReceiptPath },
    `${codexSupervisorDryRunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "codex_both_dry_run_receipt_exists",
    exists(codexBothDryRunReceiptFilePath),
    { path: codexBothDryRunReceiptPath },
    `${codexBothDryRunReceiptPath} is missing`,
  );
  addCheck(
    checks,
    blockers,
    "browser_bundle_exists",
    exists(bundlePath),
    { path: rel(bundlePath) },
    "browser-model-bundle.json is missing",
  );
  addCheck(
    checks,
    blockers,
    "detector_card_exists",
    exists(detectorCardPath),
    { path: rel(detectorCardPath) },
    "detector0-card.json is missing",
  );

  let activePrompt = null;
  if (exists(goalPath)) {
    activePrompt = extractActivePrompt(readProject("GOAL.md"));
    addCheck(
      checks,
      blockers,
      "goal_points_to_m3jb",
      activePrompt === activePromptPath,
      { active_prompt: activePrompt },
      `GOAL.md active prompt must be ${activePromptPath}`,
    );
  }

  if (exists(promptPath)) {
    const prompt = readProject(activePromptPath);
    for (const term of ["HandProposal", "HandInstance", "HandTrack", "distinct_assigned_coverage"]) {
      addCheck(
        checks,
        blockers,
        `prompt_mentions_${term}`,
        prompt.includes(term),
        { term },
        `active prompt must mention ${term}`,
      );
    }
    addCheck(
      checks,
      blockers,
      "prompt_records_brev_compute_policy",
      prompt.includes("Brev/NVIDIA GPU compute")
        && prompt.includes("Do not downsize")
        && prompt.includes("small local runs only as smoke tests"),
      {
        path: activePromptPath,
        required_terms: [
          "Brev/NVIDIA GPU compute",
          "Do not downsize",
          "small local runs only as smoke tests",
        ],
      },
      "active M3JB prompt must record the Brev compute authorization and no-artificial-downsize policy",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_heuristic_top2nms_redirect",
      prompt.includes("m3jb_heuristic_top2nms_baseline_then_deterministic_postfilters_local_no_brev")
        && prompt.includes("TOP-2 objectness + NMS")
        && prompt.includes("DETERMINISTIC post-filters"),
      {
        path: activePromptPath,
        required_terms: [
          "m3jb_heuristic_top2nms_baseline_then_deterministic_postfilters_local_no_brev",
          "TOP-2 objectness + NMS",
          "DETERMINISTIC post-filters",
        ],
      },
      "active M3JB prompt must record the local heuristic baseline redirect before Brev selector training resumes",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_landmark_retrain_brev_run_rejected_and_pivot",
      prompt.includes(landmarkRetrainBrevPlanReceiptPath)
        && prompt.includes("approved Brev retrain completed")
        && prompt.includes("HUMAN BREV SPEND APPROVAL GRANTED")
        && prompt.includes("consumed")
        && prompt.includes(
          "I approve current-thread Brev/GPU spend for M3JB landmark retrain plan v1",
        )
        && prompt.includes("copy back the planned artifacts")
        && prompt.includes(landmarkRetrainApprovalGateToken)
        && prompt.includes(landmarkRetrainRegressionPivotNextAction)
        && prompt.includes(landmarkRetrainRegressionPivotReceiptPath)
        && prompt.includes(landmarkResolutionCapacityPreflightNextAction)
        && prompt.includes("asl-pilot-m3eh-l40s-001")
        && prompt.includes("3d58wpy9o")
        && prompt.includes("$40")
        && prompt.includes("21600s")
        && prompt.includes("0.648400")
        && prompt.includes("0.365100")
        && prompt.includes("0.663300")
        && prompt.includes("0.372200")
        && prompt.includes("Do not relaunch")
        && prompt.includes("do not reuse"),
      {
        path: activePromptPath,
        required_terms: [
          landmarkRetrainBrevPlanReceiptPath,
          "approved Brev retrain completed",
          "HUMAN BREV SPEND APPROVAL GRANTED",
          "consumed",
          landmarkRetrainApprovalGateToken,
          landmarkRetrainRegressionPivotNextAction,
          landmarkRetrainRegressionPivotReceiptPath,
          landmarkResolutionCapacityPreflightNextAction,
          "asl-pilot-m3eh-l40s-001",
          "3d58wpy9o",
          "$40",
          "21600s",
          "0.648400",
          "0.365100",
          "Do not relaunch",
          "do not reuse",
        ],
      },
      "active M3JB prompt must record the consumed approved Brev retrain, failed PCK metrics, and local no-Brev pivot next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_research_guided_pck_campaign_run1",
      prompt.includes(landmarkPckCampaignDirective)
        && prompt.includes(landmarkPckCampaignResearchPlanReceiptPath)
        && prompt.includes(landmarkPckCampaignRun1ReceiptPath)
        && prompt.includes(landmarkPckCampaignRun1NextAction)
        && prompt.includes(landmarkPckCampaignRun2NextAction)
        && prompt.includes("gpt-5.5")
        && prompt.includes("$50")
        && prompt.includes("width `96`")
        && prompt.includes("heatmap grid `48`")
        && prompt.includes("width `128`")
        && prompt.includes("heatmap grid `64`")
        && prompt.includes("no destructive train-quality filter")
        && prompt.includes("0.663300")
        && prompt.includes("0.372200")
        && prompt.includes("0.739200")
        && prompt.includes("0.453300")
        && prompt.includes("stop the worker"),
      {
        path: activePromptPath,
        required_terms: [
          landmarkPckCampaignDirective,
          landmarkPckCampaignResearchPlanReceiptPath,
          landmarkPckCampaignRun1ReceiptPath,
          landmarkPckCampaignRun1NextAction,
          landmarkPckCampaignRun2NextAction,
          "gpt-5.5",
          "$50",
          "width `96`",
          "heatmap grid `48`",
          "width `128`",
          "heatmap grid `64`",
          "0.739200",
          "0.453300",
          "no destructive train-quality filter",
          "stop the worker",
        ],
      },
      "active M3JB prompt must mirror the research-guided PCK campaign approval, completed run1 metrics, and run2 next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_research_guided_pck_campaign_run2",
      prompt.includes(landmarkPckCampaignRun2ReceiptPath)
        && prompt.includes(landmarkPckCampaignRun2NextAction)
        && prompt.includes(landmarkPckCampaignRun3NextAction)
        && prompt.includes("w128/g64")
        && prompt.includes("0.749600")
        && prompt.includes("0.486700")
        && prompt.includes("0.739200")
        && prompt.includes("0.453300")
        && prompt.includes("hard-geometry")
        && prompt.includes("mild augmentation")
        && prompt.includes("STOPPED")
        && prompt.includes("0.90")
        && prompt.includes("0.75"),
      {
        path: activePromptPath,
        required_terms: [
          landmarkPckCampaignRun2ReceiptPath,
          landmarkPckCampaignRun2NextAction,
          landmarkPckCampaignRun3NextAction,
          "w128/g64",
          "0.749600",
          "0.486700",
          "hard-geometry",
          "mild augmentation",
          "STOPPED",
        ],
      },
      "active M3JB prompt must record completed run2 metrics, worker teardown, fail-closed gates, and run3 next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_research_guided_pck_campaign_run3",
      prompt.includes(landmarkPckCampaignRun3ReceiptPath)
        && prompt.includes(landmarkPckCampaignRun3NextAction)
        && prompt.includes(landmarkPckResearchRefreshAfterRun3NextAction)
        && prompt.includes("0.734000")
        && prompt.includes("0.450600")
        && prompt.includes("0.749600")
        && prompt.includes("0.486700")
        && prompt.includes("no-clear-win")
        && prompt.includes("research refresh")
        && prompt.includes("STOPPED")
        && prompt.includes("0.90")
        && prompt.includes("0.75"),
      {
        path: activePromptPath,
        required_terms: [
          landmarkPckCampaignRun3ReceiptPath,
          landmarkPckCampaignRun3NextAction,
          landmarkPckResearchRefreshAfterRun3NextAction,
          "0.734000",
          "0.450600",
          "0.749600",
          "0.486700",
          "no-clear-win",
          "research refresh",
          "STOPPED",
        ],
      },
      "active M3JB prompt must record completed run3 metrics, no-clear-win outcome, worker teardown, and research-refresh next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_pck_research_refresh_after_run3_and_resunet_preflight",
      prompt.includes(landmarkPckResearchRefreshAfterRun3ReceiptPath)
        && prompt.includes(landmarkPckResearchRefreshAfterRun3ArtifactDir)
        && prompt.includes(landmarkPckResearchRefreshAfterRun3NextAction)
        && prompt.includes(landmarkPckResunetArchitecturePreflightNextAction)
        && prompt.includes(landmarkPckRun4ResunetG64BrevToken)
        && prompt.includes("gpt-5.5")
        && prompt.includes("residual U-Net")
        && prompt.includes("lightweight hourglass")
        && prompt.includes("local code/smoke")
        && prompt.includes("keep Brev stopped")
        && prompt.includes("0.749600")
        && prompt.includes("0.486700"),
      {
        path: activePromptPath,
        required_terms: [
          landmarkPckResearchRefreshAfterRun3ReceiptPath,
          landmarkPckResearchRefreshAfterRun3ArtifactDir,
          landmarkPckResearchRefreshAfterRun3NextAction,
          landmarkPckResunetArchitecturePreflightNextAction,
          landmarkPckRun4ResunetG64BrevToken,
          "gpt-5.5",
          "residual U-Net",
          "lightweight hourglass",
          "local code/smoke",
          "keep Brev stopped",
        ],
      },
      "active M3JB prompt must record the post-run3 research refresh, selected scratch ResUNet/hourglass local preflight, and no-Brev boundary before any run4 launch",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_resunet_preflight_and_run4_envelope",
      prompt.includes(landmarkPckResunetArchitecturePreflightReceiptPath)
        && prompt.includes(landmarkPckResunetArchitecturePreflightNextAction)
        && prompt.includes(landmarkPckRun4ResunetG64BrevToken)
        && prompt.includes("712ab989d9451e92894ee72fc73e757a21f6d1ea")
        && prompt.includes("295941330493c99ef9d985520e738499e895ca18637449f6933f56037bfed3c1")
        && prompt.includes("perhand_resunet_heatmap")
        && prompt.includes("15,358,485")
        && prompt.includes("--model-arch perhand_resunet_heatmap")
        && prompt.includes("timeout 21600s brev exec asl-pilot-m3eh-l40s-001")
        && prompt.includes("validation PCK@0.10 has never matched run2 validation PCK@0.10 `0.709800`")
        && prompt.includes("stop the worker and verify `STOPPED` / `NOT READY`"),
      {
        path: activePromptPath,
        required_terms: [
          landmarkPckResunetArchitecturePreflightReceiptPath,
          landmarkPckResunetArchitecturePreflightNextAction,
          landmarkPckRun4ResunetG64BrevToken,
          "perhand_resunet_heatmap",
          "--model-arch perhand_resunet_heatmap",
          "timeout 21600s brev exec asl-pilot-m3eh-l40s-001",
        ],
      },
      "active M3JB prompt must record the completed local ResUNet preflight, exact code hash, and run4 Brev envelope before run4 is the next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_scheduler_preflight_and_run3",
      prompt.includes(recognizerSchedulerPreflightReceiptPath)
        && prompt.includes(recognizerSchedulerPreflightNextAction)
        && prompt.includes(recognizerRun3SchedulerFulltrainNextAction)
        && prompt.includes("8a780ae")
        && prompt.includes("bfa4ed698da20561e3b3005f56467edec42161f0269e3fc57535c7701b392898")
        && prompt.includes("history-best train top-1 `1.000`")
        && prompt.includes("train `7011`, monitor `955`, test `2369`")
        && prompt.includes("expected optimizer steps `13200`")
        && prompt.includes("no checkpoint")
        && prompt.includes("no Brev"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerSchedulerPreflightReceiptPath,
          recognizerSchedulerPreflightNextAction,
          recognizerRun3SchedulerFulltrainNextAction,
          "8a780ae",
          "bfa4ed698da20561e3b3005f56467edec42161f0269e3fc57535c7701b392898",
          "history-best train top-1 `1.000`",
          "train `7011`, monitor `955`, test `2369`",
          "expected optimizer steps `13200`",
          "no checkpoint",
          "no Brev",
        ],
      },
      "active M3JB prompt must record the completed recognizer scheduler preflight, side trainer hash, no-Brev/no-checkpoint boundary, and run3 next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run3_scheduler_fulltrain_result_and_research_next",
      prompt.includes(recognizerRun3SchedulerFulltrainReceiptPath)
        && prompt.includes(recognizerRun3SchedulerFulltrainNextAction)
        && prompt.includes(recognizerRun3ResearchTuningNextAction)
        && prompt.includes("test top-1 `0.2984`")
        && prompt.includes("top-5 `0.6036`")
        && prompt.includes("verification recall@FAR10 `0.7316`")
        && prompt.includes("best monitor top-1 `0.378` at epoch `184`")
        && prompt.includes("target `>=0.85`")
        && prompt.includes("fail-closed")
        && prompt.includes("STOPPED` / `NOT READY` / `HEALTHY")
        && prompt.includes("bbdd8a16f2e0142b388dbcf5303db05c329ddbbf9ae9ddfea3b1181b4e7deca3")
        && prompt.includes("aaecd21c5bde0123d5aee84e65bc40ddbccc65c05ade75887569b92bb431d329"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun3SchedulerFulltrainReceiptPath,
          recognizerRun3SchedulerFulltrainNextAction,
          recognizerRun3ResearchTuningNextAction,
          "test top-1 `0.2984`",
          "top-5 `0.6036`",
          "verification recall@FAR10 `0.7316`",
          "best monitor top-1 `0.378` at epoch `184`",
          "target `>=0.85`",
          "fail-closed",
          "STOPPED` / `NOT READY` / `HEALTHY",
          "bbdd8a16f2e0142b388dbcf5303db05c329ddbbf9ae9ddfea3b1181b4e7deca3",
          "aaecd21c5bde0123d5aee84e65bc40ddbccc65c05ade75887569b92bb431d329",
        ],
      },
      "active M3JB prompt must record the completed run3 scheduler fulltrain metrics, copied hashes, fail-closed decision, stopped worker, and no-Brev research next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run3_research_tuning_and_t32_next",
      prompt.includes(recognizerRun3ResearchTuningReceiptPath)
        && prompt.includes(recognizerRun3ResearchTuningArtifactDir)
        && prompt.includes(recognizerRun3ResearchTuningNextAction)
        && prompt.includes(recognizerT32CacheLoaderPreflightNextAction)
        && prompt.includes("gpt-5.5")
        && prompt.includes("train loss reached `0.0754`")
        && prompt.includes("verification recall@FAR10 remains")
        && prompt.includes("T=20 to T=32")
        && prompt.includes("did not launch Brev")
        && prompt.includes("change final gates"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun3ResearchTuningReceiptPath,
          recognizerRun3ResearchTuningArtifactDir,
          recognizerRun3ResearchTuningNextAction,
          recognizerT32CacheLoaderPreflightNextAction,
          "gpt-5.5",
          "train loss reached `0.0754`",
          "T=20 to T=32",
          "did not launch Brev",
          "change final gates",
        ],
      },
      "active M3JB prompt must record the completed run3 research tuning, selected T=32 local preflight, artifacts, and no-Brev/no-gate-change boundary",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_t32_cache_loader_preflight_and_materialize_next",
      prompt.includes(recognizerT32CacheLoaderPreflightReceiptPath)
        && prompt.includes(recognizerT32LoaderDryrunReceiptPath)
        && prompt.includes(recognizerT32CacheLoaderPreflightNextAction)
        && prompt.includes(recognizerT32CacheMaterializeNextAction)
        && prompt.includes("46cd3dd")
        && prompt.includes("a45f3294a7d227beacf069638bf0589c66c3d960ad87d1b912ced17ceeec1186")
        && prompt.includes("expected sequence length 32 but loaded T 20")
        && prompt.includes("logits `[4, 95]`")
        && prompt.includes("optimizer steps `0`")
        && prompt.includes("no checkpoint")
        && prompt.includes("no Brev"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerT32CacheLoaderPreflightReceiptPath,
          recognizerT32LoaderDryrunReceiptPath,
          recognizerT32CacheLoaderPreflightNextAction,
          recognizerT32CacheMaterializeNextAction,
          "46cd3dd",
          "a45f3294a7d227beacf069638bf0589c66c3d960ad87d1b912ced17ceeec1186",
          "expected sequence length 32 but loaded T 20",
          "logits `[4, 95]`",
          "optimizer steps `0`",
          "no checkpoint",
          "no Brev",
        ],
      },
      "active M3JB prompt must record the completed T=32 loader support preflight, dry-run evidence, side hash, no-Brev/no-checkpoint boundary, and local cache materialization next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_t32_cache_smoke_and_full_cache_next",
      prompt.includes(recognizerT32CacheSmokeValidateReceiptPath)
        && prompt.includes(recognizerT32CacheSmokeDryrunReceiptPath)
        && prompt.includes(recognizerT32CacheMaterializeNextAction)
        && prompt.includes(recognizerT32FullCacheMaterializeNextAction)
        && prompt.includes("9120")
        && prompt.includes("285")
        && prompt.includes("95")
        && prompt.includes("4a5b90792362a8ffa8498aa0eed6632cf7bb76afa0d8b1d9f61a3c9e3bd51116")
        && prompt.includes("logits `[8, 95]`")
        && prompt.includes("optimizer steps `0`")
        && prompt.includes("no checkpoint")
        && prompt.includes("no Brev"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerT32CacheSmokeValidateReceiptPath,
          recognizerT32CacheSmokeDryrunReceiptPath,
          recognizerT32CacheMaterializeNextAction,
          recognizerT32FullCacheMaterializeNextAction,
          "9120",
          "285",
          "95",
          "4a5b90792362a8ffa8498aa0eed6632cf7bb76afa0d8b1d9f61a3c9e3bd51116",
          "logits `[8, 95]`",
          "optimizer steps `0`",
          "no checkpoint",
          "no Brev",
        ],
      },
      "active M3JB prompt must record the completed T=32 smoke-cache materialization, dry-run evidence, no-Brev/no-checkpoint boundary, and full-cache next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_t32_full_cache_and_run4_next",
      prompt.includes(recognizerT32FullCacheValidateReceiptPath)
        && prompt.includes(recognizerT32FullCacheDryrunReceiptPath)
        && prompt.includes(recognizerT32FullCacheMaterializeNextAction)
        && prompt.includes(recognizerRun4T32FulltrainNextAction)
        && prompt.includes("330309")
        && prompt.includes("10335")
        && prompt.includes("95")
        && prompt.includes("4dc3f61018a0faf7dccdc7f3653075650683b741bf7d6f7ebde2be878dd9eb9f")
        && prompt.includes("logits `[128, 95]`")
        && prompt.includes("planned optimizer steps `13200`")
        && prompt.includes("no checkpoint")
        && prompt.includes("no Brev"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerT32FullCacheValidateReceiptPath,
          recognizerT32FullCacheDryrunReceiptPath,
          recognizerT32FullCacheMaterializeNextAction,
          recognizerRun4T32FulltrainNextAction,
          "330309",
          "10335",
          "95",
          "4dc3f61018a0faf7dccdc7f3653075650683b741bf7d6f7ebde2be878dd9eb9f",
          "logits `[128, 95]`",
          "planned optimizer steps `13200`",
          "no checkpoint",
          "no Brev",
        ],
      },
      "active M3JB prompt must record the completed full T=32 cache materialization, dry-run evidence, no-Brev/no-checkpoint boundary, and run4 Brev next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run4_t32_worker_preflight_blocker",
      prompt.includes(recognizerRun4T32PreflightBlockerReceiptPath)
        && prompt.includes(recognizerRun4T32FulltrainNextAction)
        && prompt.includes(recognizerRun4T32WaitForHealthyWorkerNextAction)
        && prompt.includes("final state `STOPPED` /")
        && prompt.includes("`NOT READY` / `UNHEALTHY")
        && prompt.includes("No remote")
        && prompt.includes("sync, training, checkpoint"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun4T32PreflightBlockerReceiptPath,
          recognizerRun4T32FulltrainNextAction,
          recognizerRun4T32WaitForHealthyWorkerNextAction,
          "final state `STOPPED` /",
          "`NOT READY` / `UNHEALTHY",
          "No remote",
          "sync, training, checkpoint",
        ],
      },
      "active M3JB prompt must record the run4 T=32 worker preflight blocker, final stopped/unhealthy state, no-training boundary, and wait/infra-approval next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run4_t32_health_refresh_blocker",
      prompt.includes(recognizerRun4T32HealthRefreshReceiptPath)
        && prompt.includes(recognizerRun4T32WaitForHealthyWorkerNextAction)
        && prompt.includes("initial read-only Brev inventory found both existing L40S workspaces were still")
        && prompt.includes("`STOPPED` / `NOT READY` / `UNHEALTHY`")
        && prompt.includes("Final read-only validation later showed retained")
        && prompt.includes("`RUNNING` / `READY` / `HEALTHY`")
        && prompt.includes("No Brev lifecycle")
        && prompt.includes("not stopped merely because it is `RUNNING` while approved run4 work remains queued"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun4T32HealthRefreshReceiptPath,
          recognizerRun4T32WaitForHealthyWorkerNextAction,
          "initial read-only Brev inventory found both existing L40S workspaces were still",
          "`STOPPED` / `NOT READY` / `UNHEALTHY`",
          "Final read-only validation later showed retained",
          "`RUNNING` / `READY` / `HEALTHY`",
          "No Brev lifecycle",
          "not stopped merely because it is `RUNNING` while approved run4 work remains queued",
        ],
      },
      "active M3JB prompt must record the run4 T=32 read-only Brev health refresh, no-spend boundary, recovered-worker final observation, and unchanged wait/infra-approval next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run4_t32_fulltrain_result",
      prompt.includes(recognizerRun4T32FulltrainReceiptPath)
        && prompt.includes(recognizerRun4T32FulltrainNextAction)
        && prompt.includes(recognizerRun4ResearchTuningNextAction)
        && prompt.includes("0.7626")
        && prompt.includes("0.3132")
        && prompt.includes("0.6214")
        && prompt.includes("best monitor top-1 `0.3927` at epoch `226`")
        && prompt.includes("JSON `7ac36c2517d3448526944a21386bee45957e659904bd2d9e6430690f0b71f279`")
        && prompt.includes("checkpoint `8ffc6fa5ccc01361a3b466a3c65c1f058ab125db1e9fb8cfc977474ef8ab2dc4`")
        && prompt.includes("log `5598205d6fe70bd3c3890c9bbae2db92666916477235281619df4c18312f342e`")
        && prompt.includes("final Brev state was `STOPPED` / `NOT READY` / `HEALTHY`")
        && prompt.includes("No browser/runtime promotion"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun4T32FulltrainReceiptPath,
          recognizerRun4T32FulltrainNextAction,
          recognizerRun4ResearchTuningNextAction,
          "0.7626",
          "0.3132",
          "0.6214",
          "best monitor top-1 `0.3927` at epoch `226`",
          "JSON `7ac36c2517d3448526944a21386bee45957e659904bd2d9e6430690f0b71f279`",
          "checkpoint `8ffc6fa5ccc01361a3b466a3c65c1f058ab125db1e9fb8cfc977474ef8ab2dc4`",
          "log `5598205d6fe70bd3c3890c9bbae2db92666916477235281619df4c18312f342e`",
          "final Brev state was `STOPPED` / `NOT READY` / `HEALTHY`",
          "No browser/runtime promotion",
        ],
      },
      "active M3JB prompt must record the completed run4 T=32 Brev fulltrain, copied artifact hashes, stopped worker, fail-closed gate status, and research-tuning next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run4_research_tuning",
      prompt.includes(recognizerRun4ResearchTuningReceiptPath)
        && prompt.includes(recognizerRun4ResearchTuningArtifactDir)
        && prompt.includes(recognizerRun4ResearchTuningNextAction)
        && prompt.includes(recognizerRun5SupconPreflightNextAction)
        && prompt.includes("supervised contrastive")
        && prompt.includes("--supcon-weight")
        && prompt.includes("--supcon-temperature")
        && prompt.includes("T=40 should wait")
        && prompt.includes("No Brev lifecycle")
        && prompt.includes("No training run"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun4ResearchTuningReceiptPath,
          recognizerRun4ResearchTuningArtifactDir,
          recognizerRun4ResearchTuningNextAction,
          recognizerRun5SupconPreflightNextAction,
          "supervised contrastive",
          "--supcon-weight",
          "--supcon-temperature",
          "T=40 should wait",
          "No Brev lifecycle",
          "No training run",
        ],
      },
      "active M3JB prompt must record the run4 no-Brev research tuning pass, GPT/API artifact directory, selected supervised-contrastive local preflight, and no-training/no-Brev boundary",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run5_supcon_preflight",
      prompt.includes(recognizerRun5SupconPreflightReceiptPath)
        && prompt.includes(recognizerRun5SupconPreflightNextAction)
        && prompt.includes(recognizerRun5SupconFulltrainNextAction)
        && prompt.includes(recognizerRun5SupconZeroWeightDryrunReceiptPath)
        && prompt.includes(recognizerRun5SupconWeight005DryrunReceiptPath)
        && prompt.includes("896d5fb")
        && prompt.includes("7.84514")
        && prompt.includes("4.918027")
        && prompt.includes("89")
        && prompt.includes("positive anchors")
        && prompt.includes("planned paid steps `13200`")
        && prompt.includes("No Brev lifecycle")
        && prompt.includes("checkpoint")
        && prompt.includes("STOPPED` / `NOT READY` / `HEALTHY"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun5SupconPreflightReceiptPath,
          recognizerRun5SupconPreflightNextAction,
          recognizerRun5SupconFulltrainNextAction,
          recognizerRun5SupconZeroWeightDryrunReceiptPath,
          recognizerRun5SupconWeight005DryrunReceiptPath,
          "896d5fb",
          "7.84514",
          "4.918027",
          "positive anchors",
          "planned paid steps `13200`",
          "No Brev lifecycle",
          "STOPPED` / `NOT READY` / `HEALTHY",
        ],
      },
      "active M3JB prompt must record the run5 SupCon preflight, focused zero-weight and weighted dry-run receipts, no-checkpoint/no-Brev boundary, stopped/healthy worker visibility, and fulltrain next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run5_supcon_fulltrain_result",
      prompt.includes(recognizerRun5SupconFulltrainReceiptPath)
        && prompt.includes(recognizerRun5SupconFulltrainNextAction)
        && prompt.includes(recognizerRun5ResearchTuningNextAction)
        && prompt.includes("0.7601")
        && prompt.includes("0.3369")
        && prompt.includes("0.6235")
        && prompt.includes("best monitor top-1 `0.4073` at epoch `178`")
        && prompt.includes("JSON `17cd25882093b750c45b58b434f0ea9717cb51564739177fb8eb2c6ae5523158`")
        && prompt.includes("checkpoint `7c685a856c1b054b22b53a09cb9a1a4edc51b1c9a41a70b030e2d05aced8ab58`")
        && prompt.includes("log `bef427391cc33db8af8e18b5fb679496d7c39b44f14f482290b7230fc6ec7b61`")
        && prompt.includes("pretrain dry-run receipt `b7f7b1a7f307af6a492d52b4931c4809dea48c85d73e50277e390b031ba47af2`")
        && prompt.includes("final Brev state was `STOPPED` / `NOT READY` / `HEALTHY`")
        && prompt.includes("No browser/runtime promotion"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun5SupconFulltrainReceiptPath,
          recognizerRun5SupconFulltrainNextAction,
          recognizerRun5ResearchTuningNextAction,
          "0.7601",
          "0.3369",
          "0.6235",
          "best monitor top-1 `0.4073` at epoch `178`",
          "JSON `17cd25882093b750c45b58b434f0ea9717cb51564739177fb8eb2c6ae5523158`",
          "checkpoint `7c685a856c1b054b22b53a09cb9a1a4edc51b1c9a41a70b030e2d05aced8ab58`",
          "log `bef427391cc33db8af8e18b5fb679496d7c39b44f14f482290b7230fc6ec7b61`",
          "pretrain dry-run receipt `b7f7b1a7f307af6a492d52b4931c4809dea48c85d73e50277e390b031ba47af2`",
          "final Brev state was `STOPPED` / `NOT READY` / `HEALTHY`",
          "No browser/runtime promotion",
        ],
      },
      "active M3JB prompt must record the completed run5 SupCon Brev fulltrain, copied artifact hashes, stopped worker, fail-closed gate status, and no-Brev research-tuning next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run5_research_tuning_and_run6_preflight",
      prompt.includes(recognizerRun5ResearchTuningReceiptPath)
        && prompt.includes(recognizerRun5ResearchTuningArtifactDir)
        && prompt.includes(recognizerRun5ResearchTuningNextAction)
        && prompt.includes(recognizerRun6VerificationMarginPreflightNextAction)
        && prompt.includes("metric-alignment")
        && prompt.includes("per-class softmax score tails")
        && prompt.includes("monitor_verification_recall_far10")
        && prompt.includes("0.7601")
        && prompt.includes("0.7626")
        && prompt.includes("No Brev lifecycle")
        && prompt.includes("do not tune SupCon harder"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun5ResearchTuningReceiptPath,
          recognizerRun5ResearchTuningArtifactDir,
          recognizerRun5ResearchTuningNextAction,
          recognizerRun6VerificationMarginPreflightNextAction,
          "metric-alignment",
          "per-class softmax score tails",
          "monitor_verification_recall_far10",
          "0.7601",
          "0.7626",
          "No Brev lifecycle",
          "do not tune SupCon harder",
        ],
      },
      "active M3JB prompt must record the completed run5 no-Brev research tuning pass, GPT/API artifact directory, selected verification-margin and monitor-verification selection preflight, stopped Brev visibility, and no-training/no-Brev boundary",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run6_verification_margin_preflight_and_fulltrain_next",
      prompt.includes(recognizerRun6VerificationMarginPreflightReceiptPath)
        && prompt.includes(recognizerRun6VerificationMarginDiagnosticReceiptPath)
        && prompt.includes(recognizerRun6VerifselectDryrunReceiptPath)
        && prompt.includes(recognizerRun6VerificationMarginPreflightNextAction)
        && prompt.includes(recognizerRun6VerifselectFulltrainNextAction)
        && prompt.includes("0f54967")
        && prompt.includes("--checkpoint-metric monitor_verification_recall_far10")
        && prompt.includes("--save-best-checkpoint")
        && prompt.includes("0.762615")
        && prompt.includes("0.760931")
        && prompt.includes("0.791417")
        && prompt.includes("0.787897")
        && prompt.includes("optimizer steps `13200`")
        && prompt.includes("weights: null")
        && prompt.includes("No Brev lifecycle")
        && prompt.includes("STOPPED` / `NOT READY` / `HEALTHY"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun6VerificationMarginPreflightReceiptPath,
          recognizerRun6VerificationMarginDiagnosticReceiptPath,
          recognizerRun6VerifselectDryrunReceiptPath,
          recognizerRun6VerificationMarginPreflightNextAction,
          recognizerRun6VerifselectFulltrainNextAction,
          "0f54967",
          "--checkpoint-metric monitor_verification_recall_far10",
          "--save-best-checkpoint",
          "0.762615",
          "0.760931",
          "0.791417",
          "0.787897",
          "optimizer steps `13200`",
          "weights: null",
          "STOPPED` / `NOT READY` / `HEALTHY",
        ],
      },
      "active M3JB prompt must record the run6 verification-margin preflight, diagnostic/dry-run receipts, side commit, monitor/test verification results, no-checkpoint/no-Brev boundary, and run6 fulltrain next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run6_t32_preflight_deferred_and_retry_next",
      prompt.includes(recognizerRun6T32PreflightBlockerReceiptPath)
        && prompt.includes(recognizerRun6VerifselectFulltrainNextAction)
        && prompt.includes("session 935")
        && prompt.includes("exited `124`")
        && prompt.includes("before any remote sync")
        && prompt.includes("UNHEALTHY` / `READY` / `UNHEALTHY")
        && prompt.includes("STOPPED` / `NOT READY` / `UNHEALTHY")
        && prompt.includes("RUNNING` / `READY` / `HEALTHY")
        && prompt.includes("STOPPED` / `NOT READY` / `HEALTHY")
        && prompt.includes("stopped for cost control")
        && prompt.includes("No destructive infrastructure action was taken")
        && prompt.includes("explicit human approval before creating, deleting, resetting, or repairing Brev infrastructure"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun6T32PreflightBlockerReceiptPath,
          recognizerRun6VerifselectFulltrainNextAction,
          "session 935",
          "exited `124`",
          "before any remote sync",
          "UNHEALTHY` / `READY` / `UNHEALTHY",
          "STOPPED` / `NOT READY` / `UNHEALTHY",
          "RUNNING` / `READY` / `HEALTHY",
          "STOPPED` / `NOT READY` / `HEALTHY",
          "stopped for cost control",
          "No destructive infrastructure action was taken",
        ],
      },
      "active M3JB prompt must record the run6 fulltrain preflight timeout, late worker recovery, stopped/healthy final state, no-sync/no-training boundary, and retry-fulltrain next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run6_verifselect_fulltrain_and_research_next",
      prompt.includes(recognizerRun6VerifselectFulltrainReceiptPath)
        && prompt.includes(recognizerRun6VerifselectFulltrainNextAction)
        && prompt.includes(recognizerRun6ResearchTuningNextAction)
        && prompt.includes("session 936")
        && prompt.includes("0.8039")
        && prompt.includes("0.287")
        && prompt.includes("0.6399")
        && prompt.includes("0.8169")
        && prompt.includes("epoch `14`")
        && prompt.includes("expected/actual optimizer steps `13200`")
        && prompt.includes("889fd3220960c8a6fd33bd9b44c34bb47a356588498a060386db04f1b7767ba3")
        && prompt.includes("STOPPED` / `NOT READY` / `HEALTHY")
        && prompt.includes("fail-closed")
        && prompt.includes("before any paid run7"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun6VerifselectFulltrainReceiptPath,
          recognizerRun6VerifselectFulltrainNextAction,
          recognizerRun6ResearchTuningNextAction,
          "session 936",
          "0.8039",
          "0.287",
          "0.6399",
          "0.8169",
          "epoch `14`",
          "expected/actual optimizer steps `13200`",
          "889fd3220960c8a6fd33bd9b44c34bb47a356588498a060386db04f1b7767ba3",
          "STOPPED` / `NOT READY` / `HEALTHY",
          "before any paid run7",
        ],
      },
      "active M3JB prompt must record completed run6 verification-selection fulltrain, copied artifact hashes, best monitor-verification checkpoint selection, fail-closed gate status, stopped worker, and no-Brev research-tuning next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run6_research_tuning_and_run7_tail_audit_next",
      prompt.includes(recognizerRun6ResearchTuningReceiptPath)
        && prompt.includes(recognizerRun6ResearchTuningArtifactDir)
        && prompt.includes(recognizerRun6ResearchTuningNextAction)
        && prompt.includes(recognizerRun7VerificationTailAuditNextAction)
        && prompt.includes(recognizerRun7ClassBalancedCeFulltrainNextAction)
        && prompt.includes("session 937")
        && prompt.includes("resp_0ded03e26cd18905006a21042a4e5081949efd9c2f60c581af")
        && prompt.includes("gpt-5.5-2026-04-23")
        && prompt.includes("8857")
        && prompt.includes("3106")
        && prompt.includes("0.8169")
        && prompt.includes("0.8039")
        && prompt.includes("score-tail")
        && prompt.includes("teacher-coverage imbalance")
        && prompt.includes("abs `<=0.002` of `0.8039`")
        && prompt.includes("beta 0.999")
        && prompt.includes("max weight `4.0`")
        && prompt.includes("Do not launch run7"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun6ResearchTuningReceiptPath,
          recognizerRun6ResearchTuningArtifactDir,
          recognizerRun6ResearchTuningNextAction,
          recognizerRun7VerificationTailAuditNextAction,
          recognizerRun7ClassBalancedCeFulltrainNextAction,
          "session 937",
          "resp_0ded03e26cd18905006a21042a4e5081949efd9c2f60c581af",
          "gpt-5.5-2026-04-23",
          "0.8169",
          "0.8039",
          "teacher-coverage imbalance",
          "abs `<=0.002` of `0.8039`",
          "Do not launch run7",
        ],
      },
      "active M3JB prompt must record completed run6 research tuning, GPT/API artifacts, selected no-Brev verification-tail audit, gated class-balanced run7 candidate, no-training/no-Brev boundary, and no-launch warning",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run7_tail_audit_and_hard_negative_research_next",
      prompt.includes(recognizerRun7VerificationTailAuditReceiptPath)
        && prompt.includes(recognizerRun7VerificationTailDiagnosticReceiptPath)
        && prompt.includes(recognizerRun7VerificationTailAuditNextAction)
        && prompt.includes(recognizerRun7HardNegativeObjectiveResearchNextAction)
        && prompt.includes("session 938")
        && prompt.includes("0.8038559556786704")
        && prompt.includes("0.000044")
        && prompt.includes("not_proven")
        && prompt.includes("5 of the top 10")
        && prompt.includes("give")
        && prompt.includes("airplane")
        && prompt.includes("milk")
        && prompt.includes("hungry / please")
        && prompt.includes("Do not launch class-balanced CE run7"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun7VerificationTailAuditReceiptPath,
          recognizerRun7VerificationTailDiagnosticReceiptPath,
          recognizerRun7VerificationTailAuditNextAction,
          recognizerRun7HardNegativeObjectiveResearchNextAction,
          "session 938",
          "0.8038559556786704",
          "not_proven",
          "5 of the top 10",
          "hungry / please",
          "Do not launch class-balanced CE run7",
        ],
      },
      "active M3JB prompt must record completed run7 verification-tail audit, reproduced run6 recall, not-proven count/coverage constraint, hard-negative tail evidence, and the no-Brev research next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run7_hard_negative_research_and_ovr_bce_next",
      prompt.includes(recognizerRun7HardNegativeObjectiveResearchReceiptPath)
        && prompt.includes(recognizerRun7HardNegativeObjectiveResearchArtifactDir)
        && prompt.includes(recognizerRun7HardNegativeObjectiveResearchNextAction)
        && prompt.includes(recognizerRun7OvrBceHardnegPreflightNextAction)
        && prompt.includes(recognizerRun7OvrBceHardnegFulltrainNextAction)
        && (prompt.includes("session 939") || prompt.includes("Session 939"))
        && prompt.includes("resp_01ecb85353047dea006a210c8ca0cc8197804703931d228b1d")
        && prompt.includes("gpt-5.5-2026-04-23")
        && prompt.includes("11645")
        && prompt.includes("4422")
        && prompt.includes("--ovr-bce-weight")
        && prompt.includes("--ovr-bce-hard-k 8")
        && prompt.includes("uses_test_mined_pairs_for_training: false")
        && prompt.includes("class-balanced CE")
        && prompt.includes("T=40"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun7HardNegativeObjectiveResearchReceiptPath,
          recognizerRun7HardNegativeObjectiveResearchArtifactDir,
          recognizerRun7HardNegativeObjectiveResearchNextAction,
          recognizerRun7OvrBceHardnegPreflightNextAction,
          recognizerRun7OvrBceHardnegFulltrainNextAction,
          "session 939",
          "resp_01ecb85353047dea006a210c8ca0cc8197804703931d228b1d",
          "--ovr-bce-weight",
          "uses_test_mined_pairs_for_training: false",
        ],
      },
      "active M3JB prompt must record completed run7 hard-negative objective research, GPT/API artifacts, selected OVR-BCE hard-negative preflight, and no-Brev/no-training boundaries",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run7_ovr_bce_preflight_and_fulltrain_next",
      prompt.includes(recognizerRun7OvrBceHardnegPreflightReceiptPath)
        && prompt.includes(recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptPath)
        && prompt.includes(recognizerRun7OvrBceHardnegWeight003DryrunReceiptPath)
        && prompt.includes(recognizerRun7OvrBceHardnegPreflightNextAction)
        && prompt.includes(recognizerRun7OvrBceHardnegFulltrainNextAction)
        && prompt.includes("session 940")
        && prompt.includes("828f5cf5")
        && prompt.includes("0.047071")
        && prompt.includes("1024")
        && prompt.includes("selected_negative_matches_true_label")
        && prompt.includes("Current next action after session 940"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun7OvrBceHardnegPreflightReceiptPath,
          recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptPath,
          recognizerRun7OvrBceHardnegWeight003DryrunReceiptPath,
          recognizerRun7OvrBceHardnegFulltrainNextAction,
          "session 940",
          "828f5cf5",
          "0.047071",
          "selected_negative_matches_true_label",
        ],
      },
      "active M3JB prompt must record completed run7 OVR-BCE hard-negative preflight, dry-run receipts, side commit, no-training proof, and the gated full-train next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run7_ovr_bce_fulltrain_and_research_next",
      prompt.includes(recognizerRun7OvrBceHardnegFulltrainReceiptPath)
        && prompt.includes(recognizerRun7OvrBceHardnegFulltrainNextAction)
        && prompt.includes(recognizerRun7OvrBceResearchTuningNextAction)
        && prompt.includes("session 941")
        && prompt.includes("0.7759")
        && prompt.includes("0.8039")
        && prompt.includes("13200")
        && prompt.includes("STOPPED")
        && prompt.includes("no-Brev research/postmortem"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun7OvrBceHardnegFulltrainReceiptPath,
          recognizerRun7OvrBceHardnegFulltrainNextAction,
          recognizerRun7OvrBceResearchTuningNextAction,
          "session 941",
          "0.7759",
          "0.8039",
          "STOPPED",
        ],
      },
      "active M3JB prompt must record completed run7 OVR-BCE Brev fulltrain, fail-closed regression versus run6, stopped worker, and no-Brev research/postmortem next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run7_ovr_bce_research_tuning_and_calibration_audit_next",
      prompt.includes(recognizerRun7OvrBceResearchTuningReceiptPath)
        && prompt.includes(recognizerRun7OvrBceResearchTuningNextAction)
        && prompt.includes(recognizerRun6VsRun7CalibrationAuditNextAction)
        && (prompt.includes("session 942") || prompt.includes("Session 942"))
        && prompt.includes("resp_077b7bdd7c4483eb006a211f48d0ec81979b381333045daf88")
        && prompt.includes("gpt-5.5-2026-04-23")
        && prompt.includes("0.8276")
        && prompt.includes("0.7759")
        && prompt.includes("0.8039")
        && prompt.includes("OVR-BCE weight 0.01")
        && prompt.includes("no-Brev paired calibration audit"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun7OvrBceResearchTuningReceiptPath,
          recognizerRun7OvrBceResearchTuningNextAction,
          recognizerRun6VsRun7CalibrationAuditNextAction,
          "session 942",
          "resp_077b7bdd7c4483eb006a211f48d0ec81979b381333045daf88",
          "0.8276",
          "0.7759",
          "0.8039",
        ],
      },
      "active M3JB prompt must record completed run7 OVR-BCE research/postmortem, gpt-5.5 response evidence, selected paired calibration audit next action, and gated run8 weight-0.01 candidate",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run6_vs_run7_calibration_audit_failed_reproduction_next",
      prompt.includes(recognizerRun6VsRun7CalibrationAuditReceiptPath)
        && prompt.includes(recognizerRun6VsRun7CalibrationDetailedReceiptPath)
        && prompt.includes(recognizerRun6VsRun7CalibrationAuditNextAction)
        && prompt.includes(recognizerRun7TestRecallReproductionDiscrepancyNextAction)
        && prompt.includes("session 943")
        && prompt.includes("bfd1e783")
        && prompt.includes("0.7750692520775622")
        && prompt.includes("0.0008307479224378689")
        && prompt.includes("does **not** authorize paid")
        && prompt.includes("run8"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun6VsRun7CalibrationAuditReceiptPath,
          recognizerRun6VsRun7CalibrationDetailedReceiptPath,
          recognizerRun6VsRun7CalibrationAuditNextAction,
          recognizerRun7TestRecallReproductionDiscrepancyNextAction,
          "session 943",
          "bfd1e783",
          "0.7750692520775622",
        ],
      },
      "active M3JB prompt must record completed run6-vs-run7 paired calibration audit, failed run7 reproduction tolerance, no run8 authorization, and no-Brev discrepancy next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run7_test_recall_discrepancy_resolution_next_preflight",
      prompt.includes(recognizerRun7TestRecallReproductionDiscrepancyReceiptPath)
        && prompt.includes(recognizerRun7TestRecallReproductionDiscrepancyNextAction)
        && prompt.includes(recognizerRun8OvrBceW001PreflightNextAction)
        && prompt.includes("Current next action after session 944")
        && prompt.includes("session 944")
        && prompt.includes("0.7759113573407201")
        && prompt.includes("0.7750692520775622")
        && prompt.includes("0.0008421052631579")
        && prompt.includes("not")
        && prompt.includes("see")
        && prompt.includes("93/95")
        && prompt.includes("CPU-vs-original-CUDA numerical boundary sensitivity")
        && prompt.includes("did not launch")
        && prompt.includes("authorize paid run8")
        && prompt.includes("OVR-BCE weight `0.01`"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun7TestRecallReproductionDiscrepancyReceiptPath,
          recognizerRun7TestRecallReproductionDiscrepancyNextAction,
          recognizerRun8OvrBceW001PreflightNextAction,
          "session 944",
          "0.7759113573407201",
          "0.0008421052631579",
          "CPU-vs-original-CUDA numerical boundary sensitivity",
        ],
      },
      "active M3JB prompt must record completed run7 test-recall discrepancy resolution, two-class threshold-boundary cause, no paid run8 launch/authorization, and no-Brev run8 w0.01 preflight next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run8_ovr_bce_w001_preflight_complete_next_fulltrain",
      prompt.includes(recognizerRun8OvrBceW001PreflightReceiptPath)
        && prompt.includes(recognizerRun8OvrBceW001DryrunReceiptPath)
        && prompt.includes(recognizerRun8OvrBceW001PreflightNextAction)
        && prompt.includes(recognizerRun8OvrBceW001FulltrainNextAction)
        && prompt.includes("At that point, next action after session 945 was")
        && prompt.includes("session 945")
        && prompt.includes("0.01569")
        && prompt.includes("7.86083")
        && prompt.includes("selected_negative_matches_true_label: 0")
        && prompt.includes("uses_test_mined_pairs_for_training: false")
        && prompt.includes("Read-only `brev ls --json` showed both L40S")
        && prompt.includes("bounded fulltrain envelope"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun8OvrBceW001PreflightReceiptPath,
          recognizerRun8OvrBceW001DryrunReceiptPath,
          recognizerRun8OvrBceW001PreflightNextAction,
          recognizerRun8OvrBceW001FulltrainNextAction,
          "session 945",
          "0.01569",
          "7.86083",
        ],
      },
      "active M3JB prompt must record completed run8 OVR-BCE w0.01 no-Brev preflight, key dry-run invariants, stopped Brev visibility, and bounded fulltrain next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run8_ovr_bce_w001_brev_preflight_blocker_next_fulltrain_retry",
      prompt.includes(recognizerRun8OvrBceW001PreflightBlockerReceiptPath)
        && prompt.includes(recognizerRun8OvrBceW001FulltrainNextAction)
        && prompt.includes("Current next action after session 946")
        && prompt.includes("session 946")
        && prompt.includes("SSH preflight never became")
        && prompt.includes("reachable and the worker degraded to `UNHEALTHY`")
        && prompt.includes("later read-only final")
        && prompt.includes("`RUNNING` / `READY`")
        && prompt.includes("not stopped merely because approved run8 work remains")
        && prompt.includes("CUDA/process preflight")
        && prompt.includes("sync/hash verification")
        && prompt.includes("optimizer/backward")
        && prompt.includes("final-gate change")
        && prompt.includes("`brev stop --all`")
        && prompt.includes("not create, delete, reset, or repair Brev")
        && prompt.includes("infrastructure without explicit human")
        && prompt.includes("approval"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun8OvrBceW001PreflightBlockerReceiptPath,
          recognizerRun8OvrBceW001FulltrainNextAction,
          "session 946",
          "SSH preflight never became",
          "reachable and the worker degraded to `UNHEALTHY`",
          "later read-only final",
          "not stopped merely because approved run8 work remains",
          "not create, delete, reset, or repair Brev",
          "infrastructure without explicit human",
          "approval",
        ],
      },
      "active M3JB prompt must record the run8 Brev SSH preflight blocker, no-training/no-gate-change boundaries, teardown, late worker recovery, and bounded fulltrain retry next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run8_ovr_bce_w001_fulltrain_and_research_next",
      prompt.includes(recognizerRun8OvrBceW001FulltrainReceiptPath)
        && prompt.includes(recognizerRun8OvrBceW001ResearchTuningNextAction)
        && prompt.includes("RUN8 OVR-BCE W0.01 FULLTRAIN RESULT")
        && prompt.includes("session 947")
        && prompt.includes("verification recall@FAR10 `0.7571`")
        && prompt.includes("top-1 `0.3081`")
        && prompt.includes("top-5 `0.6079`")
        && prompt.includes("best monitor-verification checkpoint was epoch `83`")
        && prompt.includes("best score `0.8252875272322179`")
        && prompt.includes("Brev API auth became unavailable")
        && prompt.includes("SSH was unreachable after OS shutdown")
        && prompt.includes("Do not launch another paid run blindly"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun8OvrBceW001FulltrainReceiptPath,
          recognizerRun8OvrBceW001ResearchTuningNextAction,
          "session 947",
          "verification recall@FAR10 `0.7571`",
          "Brev API auth became unavailable",
          "Do not launch another paid run blindly",
        ],
      },
      "active M3JB prompt must record completed run8 OVR-BCE w0.01 fulltrain, fail-closed metrics, copyback/teardown caveat, and no-Brev research next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run8_ovr_bce_w001_research_tuning_and_three_run_audit_next",
      prompt.includes(recognizerRun8OvrBceW001ResearchTuningReceiptPath)
        && prompt.includes(recognizerRun8OvrBceW001ResearchTuningNextAction)
        && prompt.includes(recognizerRun6Run7Run8CalibrationTailAuditNextAction)
        && prompt.includes("RUN8 OVR-BCE W0.01 RESEARCH/POSTMORTEM RESULT")
        && prompt.includes("session 948")
        && prompt.includes("stop OVR-BCE for now")
        && prompt.includes("no paid recipe yet")
        && prompt.includes("Brev auth recovery")
        && prompt.includes("run6/run7/run8 verification calibration-tail"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun8OvrBceW001ResearchTuningReceiptPath,
          recognizerRun8OvrBceW001ResearchTuningNextAction,
          recognizerRun6Run7Run8CalibrationTailAuditNextAction,
          "session 948",
          "stop OVR-BCE for now",
          "no paid recipe yet",
          "Brev auth recovery",
        ],
      },
      "active M3JB prompt must record completed run8 OVR-BCE research/postmortem, no-Brev/no-training boundaries, no paid recipe yet, Brev auth prerequisite, and the three-run calibration-tail audit next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run6_run7_run8_calibration_tail_audit_next_research",
      prompt.includes(recognizerRun6Run7Run8CalibrationTailAuditReceiptPath)
        && prompt.includes(recognizerRun6Run7Run8CalibrationTailDetailedReceiptPath)
        && prompt.includes(recognizerRun6Run7Run8CalibrationTailAuditNextAction)
        && prompt.includes(recognizerPostOvrBceCalibrationSafeResearchNextAction)
        && prompt.includes("session 949")
        && prompt.includes("ad16b00d")
        && prompt.includes("0.8038559556786704")
        && prompt.includes("0.7750692520775622")
        && prompt.includes("0.7571191135734074")
        && prompt.includes("broader positive-margin damage")
        && prompt.includes("localized positive-margin damage")
        && prompt.includes("run7 is best by monitor")
        && prompt.includes("run6 is best by held-out test")
        && prompt.includes("no paid recipe"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun6Run7Run8CalibrationTailAuditReceiptPath,
          recognizerRun6Run7Run8CalibrationTailDetailedReceiptPath,
          recognizerRun6Run7Run8CalibrationTailAuditNextAction,
          recognizerPostOvrBceCalibrationSafeResearchNextAction,
          "session 949",
          "ad16b00d",
          "broader positive-margin damage",
          "localized positive-margin damage",
        ],
      },
      "active M3JB prompt must record completed run6/run7/run8 calibration-tail audit, monitor-vs-test mismatch, no paid recipe, and next no-Brev calibration-safe research action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_post_ovr_bce_calibration_safe_research_next_preflight",
      prompt.includes(recognizerPostOvrBceCalibrationSafeResearchReceiptPath)
        && prompt.includes(recognizerPostOvrBceCalibrationSafeResearchNextAction)
        && prompt.includes(recognizerRun6MonitorSelectionStabilityPreflightNextAction)
        && prompt.includes("session 950")
        && prompt.includes("resp_0701b4689f25eb29006a214576dcac8197b1f838ad45dbf2b5")
        && prompt.includes("run6 monitor/checkpoint-selection stability preflight")
        && prompt.includes("no paid recipe yet")
        && prompt.includes("Brev auth recovery"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerPostOvrBceCalibrationSafeResearchReceiptPath,
          recognizerPostOvrBceCalibrationSafeResearchNextAction,
          recognizerRun6MonitorSelectionStabilityPreflightNextAction,
          "session 950",
          "resp_0701b4689f25eb29006a214576dcac8197b1f838ad45dbf2b5",
          "run6 monitor/checkpoint-selection stability preflight",
          "no paid recipe yet",
        ],
      },
      "active M3JB prompt must record completed post-OVR-BCE calibration-safe research, no paid recipe, Brev auth prerequisite, and next run6 monitor-selection stability preflight",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run6_monitor_selection_stability_preflight_next_retention",
      prompt.includes(recognizerRun6MonitorSelectionStabilityPreflightReceiptPath)
        && prompt.includes(recognizerRun6MonitorSelectionStabilityDetailedReceiptPath)
        && prompt.includes(recognizerRun6MonitorSelectionStabilityPreflightNextAction)
        && prompt.includes(recognizerCandidateCheckpointRetentionPreflightNextAction)
        && prompt.includes("session 951")
        && prompt.includes("epoch `31`")
        && prompt.includes("alternate_epoch_checkpoint_count: 0")
        && prompt.includes("per_epoch_logits_count: 0")
        && prompt.includes("no paid recipe is selected")
        && prompt.includes("Brev auth recovery"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun6MonitorSelectionStabilityPreflightReceiptPath,
          recognizerRun6MonitorSelectionStabilityDetailedReceiptPath,
          recognizerRun6MonitorSelectionStabilityPreflightNextAction,
          recognizerCandidateCheckpointRetentionPreflightNextAction,
          "session 951",
          "epoch `31`",
          "alternate_epoch_checkpoint_count: 0",
          "per_epoch_logits_count: 0",
        ],
      },
      "active M3JB prompt must record completed run6 monitor-selection stability preflight, artifact insufficiency for epoch 31, no paid recipe, Brev auth prerequisite, and next candidate-checkpoint retention preflight",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_candidate_checkpoint_retention_preflight_next_research",
      prompt.includes(recognizerCandidateCheckpointRetentionPreflightReceiptPath)
        && prompt.includes(recognizerCandidateCheckpointRetentionDryrunReceiptPath)
        && prompt.includes(recognizerCandidateCheckpointRetentionPreflightNextAction)
        && prompt.includes(recognizerRetentionEnabledResearchTuningNextAction)
        && prompt.includes("session 952")
        && prompt.includes("candidate checkpoint retention")
        && prompt.includes("planned optimizer steps `13200`")
        && prompt.includes("checkpoint_write_blocker: `dry_run_forward`")
        && prompt.includes("retained_checkpoint_count: 0")
        && prompt.includes("no paid recipe is selected")
        && prompt.includes("Brev auth recovery"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerCandidateCheckpointRetentionPreflightReceiptPath,
          recognizerCandidateCheckpointRetentionDryrunReceiptPath,
          recognizerCandidateCheckpointRetentionPreflightNextAction,
          recognizerRetentionEnabledResearchTuningNextAction,
          "session 952",
          "checkpoint_write_blocker: `dry_run_forward`",
          "retained_checkpoint_count: 0",
        ],
      },
      "active M3JB prompt must record completed candidate checkpoint retention preflight, no checkpoint write, no paid recipe, Brev auth prerequisite, and next no-Brev research/tuning action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_retention_enabled_research_tuning_next_run9_preflight",
      prompt.includes(recognizerRetentionEnabledResearchTuningReceiptPath)
        && prompt.includes(recognizerRetentionEnabledResearchTuningArtifactDir)
        && prompt.includes(recognizerRetentionEnabledResearchTuningNextAction)
        && prompt.includes(recognizerRun9RetentionEnabledRun6RecipePreflightNextAction)
        && prompt.includes("session 953")
        && prompt.includes("resp_0c05446d4cf7fa7b006a214fd83d4881969db35a0dcba78d49")
        && prompt.includes("record_run9_retention_enabled_run6_recipe")
        && prompt.includes("no paid fulltrain")
        && prompt.includes("Brev auth recovery"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRetentionEnabledResearchTuningReceiptPath,
          recognizerRetentionEnabledResearchTuningArtifactDir,
          recognizerRetentionEnabledResearchTuningNextAction,
          recognizerRun9RetentionEnabledRun6RecipePreflightNextAction,
          "session 953",
          "record_run9_retention_enabled_run6_recipe",
        ],
      },
      "active M3JB prompt must record completed retention-enabled research tuning, gpt-5.5 fallback artifacts, no paid fulltrain authorization, Brev auth prerequisite, and next run9 retention recipe preflight",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run9_retention_enabled_recipe_preflight_next_auth",
      prompt.includes(recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath)
        && prompt.includes(recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath)
        && prompt.includes(recognizerRun9RetentionEnabledRun6RecipePreflightNextAction)
        && prompt.includes(recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction)
        && prompt.includes(recognizerRun9RetentionEnabledRun6FulltrainAfterAuthNextAction)
        && prompt.includes("session 954")
        && prompt.includes("zero optimizer/backward steps")
        && prompt.includes("future compute envelope")
        && prompt.includes("Brev auth")
        && prompt.includes("successful `brev ls --json`"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath,
          recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath,
          recognizerRun9RetentionEnabledRun6RecipePreflightNextAction,
          recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction,
          recognizerRun9RetentionEnabledRun6FulltrainAfterAuthNextAction,
          "session 954",
          "zero optimizer/backward steps",
        ],
      },
      "active M3JB prompt must record completed run9 retention-enabled run6 recipe preflight, no-save dry-run evidence, future envelope/kill criteria, Brev auth blocker, and next no-spend Brev visibility refresh",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run9_brev_auth_visibility_blocker",
      prompt.includes(recognizerRun9BrevAuthVisibilityRefreshReceiptPath)
        && prompt.includes(recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction)
        && prompt.includes(recognizerRun9RetentionEnabledAwaitBrevLoginNextAction)
        && prompt.includes("session 955")
        && prompt.includes("brev ls --json")
        && prompt.includes("exit `1`")
        && prompt.includes("You are currently logged out")
        && prompt.includes("EOF")
        && prompt.includes("future run9 fulltrain remains blocked"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun9BrevAuthVisibilityRefreshReceiptPath,
          recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction,
          recognizerRun9RetentionEnabledAwaitBrevLoginNextAction,
          "session 955",
          "You are currently logged out",
          "future run9 fulltrain remains blocked",
        ],
      },
      "active M3JB prompt must record completed run9 Brev auth visibility refresh, the logged-out/EOF blocker, no lifecycle/spend, and the human login next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run9_brev_auth_visibility_retry_blocker",
      prompt.includes(recognizerRun9BrevAuthVisibilityRetryReceiptPath)
        && prompt.includes(recognizerRun9BrevAuthVisibilityRefreshReceiptPath)
        && prompt.includes(recognizerRun9RetentionEnabledAwaitBrevLoginNextAction)
        && prompt.includes("session 956")
        && prompt.includes("still logged out")
        && prompt.includes("brev ls --json")
        && prompt.includes("exit `1`")
        && prompt.includes("You are currently logged out")
        && prompt.includes("EOF")
        && prompt.includes("future run9 fulltrain remains blocked"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun9BrevAuthVisibilityRetryReceiptPath,
          recognizerRun9BrevAuthVisibilityRefreshReceiptPath,
          recognizerRun9RetentionEnabledAwaitBrevLoginNextAction,
          "session 956",
          "still logged out",
          "You are currently logged out",
          "future run9 fulltrain remains blocked",
        ],
      },
      "active M3JB prompt must record completed run9 Brev auth visibility retry, the still-logged-out/EOF blocker, no lifecycle/spend, and the unchanged human login next action",
    );
    addCheck(
      checks,
      blockers,
      "prompt_records_recognizer_run9_brev_auth_human_login_boundary",
      prompt.includes(recognizerRun9BrevAuthHumanLoginBoundaryReceiptPath)
        && prompt.includes(recognizerRun9BrevAuthVisibilityRetryReceiptPath)
        && prompt.includes(recognizerRun9RetentionEnabledWaitForHumanBrevLoginNextAction)
        && prompt.includes(recognizerRun9RetentionEnabledAwaitBrevLoginNextAction)
        && prompt.includes("session 958")
        && prompt.includes("no further automated Brev CLI visibility retries")
        && prompt.includes("human explicitly confirms")
        && prompt.includes("You are currently logged out")
        && prompt.includes("future run9 fulltrain remains blocked"),
      {
        path: activePromptPath,
        required_terms: [
          recognizerRun9BrevAuthHumanLoginBoundaryReceiptPath,
          recognizerRun9BrevAuthVisibilityRetryReceiptPath,
          recognizerRun9RetentionEnabledWaitForHumanBrevLoginNextAction,
          recognizerRun9RetentionEnabledAwaitBrevLoginNextAction,
          "session 958",
          "no further automated Brev CLI visibility retries",
          "human explicitly confirms",
          "future run9 fulltrain remains blocked",
        ],
      },
      "active M3JB prompt must record the run9 Brev auth human-login boundary, stop further automated visibility retries until explicit human confirmation, and preserve no-spend/no-lifecycle boundaries",
    );
  }

  if (exists(goalPath)) {
    const goal = readProject("GOAL.md");
    addCheck(
      checks,
      blockers,
      "goal_records_brev_compute_policy",
      goal.includes("Brev compute authorization")
        && goal.includes("Future loops must not")
        && goal.includes("smaller final training/evaluation datasets"),
      {
        path: "GOAL.md",
        required_terms: [
          "Brev compute authorization",
          "Future loops must not",
          "smaller final training/evaluation datasets",
        ],
      },
      "GOAL.md must record the Brev compute authorization and no-artificial-downsize policy",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_landmark_retrain_brev_run_rejected_and_pivot",
      goal.includes(landmarkRetrainBrevPlanReceiptPath)
        && goal.includes("POST-LAUNCH RESULT")
        && goal.includes("HUMAN BREV SPEND APPROVAL GRANTED AND CONSUMED")
        && goal.includes(
          "I approve current-thread Brev/GPU spend for M3JB landmark retrain plan v1",
        )
        && goal.includes("copy back the planned artifacts")
        && goal.includes(landmarkRetrainApprovalGateToken)
        && goal.includes(landmarkRetrainRegressionPivotNextAction)
        && goal.includes(landmarkRetrainRegressionPivotReceiptPath)
        && goal.includes(landmarkResolutionCapacityPreflightNextAction)
        && goal.includes("asl-pilot-m3eh-l40s-001")
        && goal.includes("3d58wpy9o")
        && goal.includes("$40")
        && goal.includes("21600s")
        && goal.includes("0.648400")
        && goal.includes("0.365100")
        && goal.includes("0.663300")
        && goal.includes("0.372200")
        && goal.includes("Do **not** relaunch")
        && goal.includes("Do not exceed, rerun, or repurpose"),
      {
        path: "GOAL.md",
        required_terms: [
          landmarkRetrainBrevPlanReceiptPath,
          "POST-LAUNCH RESULT",
          "HUMAN BREV SPEND APPROVAL GRANTED AND CONSUMED",
          landmarkRetrainApprovalGateToken,
          landmarkRetrainRegressionPivotNextAction,
          landmarkRetrainRegressionPivotReceiptPath,
          landmarkResolutionCapacityPreflightNextAction,
          "asl-pilot-m3eh-l40s-001",
          "3d58wpy9o",
          "$40",
          "21600s",
          "0.648400",
          "0.365100",
          "Do **not** relaunch",
          "Do not exceed, rerun, or repurpose",
        ],
      },
      "GOAL.md must record the consumed approved Brev retrain, failed PCK metrics, and local no-Brev pivot next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_research_guided_pck_campaign_run1",
      goal.includes(landmarkPckCampaignDirective)
        && goal.includes(landmarkPckCampaignResearchPlanReceiptPath)
        && goal.includes(landmarkPckCampaignRun1ReceiptPath)
        && goal.includes(landmarkPckCampaignRun1NextAction)
        && goal.includes(landmarkPckCampaignRun2NextAction)
        && goal.includes("gpt-5.5")
        && goal.includes("$50")
        && goal.includes("width `96`")
        && goal.includes("heatmap grid `48`")
        && goal.includes("width `128`")
        && goal.includes("heatmap grid `64`")
        && goal.includes("no destructive train-quality filter")
        && goal.includes("0.663300")
        && goal.includes("0.372200")
        && goal.includes("0.739200")
        && goal.includes("0.453300")
        && goal.includes("stop the worker"),
      {
        path: "GOAL.md",
        required_terms: [
          landmarkPckCampaignDirective,
          landmarkPckCampaignResearchPlanReceiptPath,
          landmarkPckCampaignRun1ReceiptPath,
          landmarkPckCampaignRun1NextAction,
          landmarkPckCampaignRun2NextAction,
          "gpt-5.5",
          "$50",
          "width `96`",
          "heatmap grid `48`",
          "width `128`",
          "heatmap grid `64`",
          "0.739200",
          "0.453300",
          "no destructive train-quality filter",
          "stop the worker",
        ],
      },
      "GOAL.md must record the research-guided PCK campaign approval, completed run1 metrics, and run2 next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_research_guided_pck_campaign_run2",
      goal.includes(landmarkPckCampaignRun2ReceiptPath)
        && goal.includes(landmarkPckCampaignRun2NextAction)
        && goal.includes(landmarkPckCampaignRun3NextAction)
        && goal.includes("w128/g64")
        && goal.includes("0.749600")
        && goal.includes("0.486700")
        && goal.includes("0.739200")
        && goal.includes("0.453300")
        && goal.includes("hard-geometry")
        && goal.includes("mild augmentation")
        && goal.includes("STOPPED")
        && goal.includes("0.90")
        && goal.includes("0.75"),
      {
        path: "GOAL.md",
        required_terms: [
          landmarkPckCampaignRun2ReceiptPath,
          landmarkPckCampaignRun2NextAction,
          landmarkPckCampaignRun3NextAction,
          "w128/g64",
          "0.749600",
          "0.486700",
          "hard-geometry",
          "mild augmentation",
          "STOPPED",
        ],
      },
      "GOAL.md must record completed run2 metrics, worker teardown, fail-closed gates, and run3 next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_research_guided_pck_campaign_run3",
      goal.includes(landmarkPckCampaignRun3ReceiptPath)
        && goal.includes(landmarkPckCampaignRun3NextAction)
        && goal.includes(landmarkPckResearchRefreshAfterRun3NextAction)
        && goal.includes("0.734000")
        && goal.includes("0.450600")
        && goal.includes("0.749600")
        && goal.includes("0.486700")
        && goal.includes("no-clear-win")
        && goal.includes("research refresh")
        && goal.includes("STOPPED")
        && goal.includes("0.90")
        && goal.includes("0.75"),
      {
        path: "GOAL.md",
        required_terms: [
          landmarkPckCampaignRun3ReceiptPath,
          landmarkPckCampaignRun3NextAction,
          landmarkPckResearchRefreshAfterRun3NextAction,
          "0.734000",
          "0.450600",
          "0.749600",
          "0.486700",
          "no-clear-win",
          "research refresh",
          "STOPPED",
        ],
      },
      "GOAL.md must record completed run3 metrics, no-clear-win outcome, worker teardown, and research-refresh next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_pck_research_refresh_after_run3_and_resunet_preflight",
      goal.includes(landmarkPckResearchRefreshAfterRun3ReceiptPath)
        && goal.includes(landmarkPckResearchRefreshAfterRun3ArtifactDir)
        && goal.includes(landmarkPckResearchRefreshAfterRun3NextAction)
        && goal.includes(landmarkPckResunetArchitecturePreflightNextAction)
        && goal.includes(landmarkPckRun4ResunetG64BrevToken)
        && goal.includes("gpt-5.5")
        && goal.includes("residual U-Net")
        && goal.includes("lightweight hourglass")
        && goal.includes("local code/smoke")
        && goal.includes("keep Brev stopped")
        && goal.includes("0.749600")
        && goal.includes("0.486700"),
      {
        path: "GOAL.md",
        required_terms: [
          landmarkPckResearchRefreshAfterRun3ReceiptPath,
          landmarkPckResearchRefreshAfterRun3ArtifactDir,
          landmarkPckResearchRefreshAfterRun3NextAction,
          landmarkPckResunetArchitecturePreflightNextAction,
          landmarkPckRun4ResunetG64BrevToken,
          "gpt-5.5",
          "residual U-Net",
          "lightweight hourglass",
          "local code/smoke",
          "keep Brev stopped",
        ],
      },
      "GOAL.md must record the post-run3 research refresh, selected scratch ResUNet/hourglass local preflight, and no-Brev boundary before any run4 launch",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_resunet_preflight_and_run4_envelope",
      goal.includes(landmarkPckResunetArchitecturePreflightReceiptPath)
        && goal.includes(landmarkPckResunetArchitecturePreflightNextAction)
        && goal.includes(landmarkPckRun4ResunetG64BrevToken)
        && goal.includes("712ab989d9451e92894ee72fc73e757a21f6d1ea")
        && goal.includes("295941330493c99ef9d985520e738499e895ca18637449f6933f56037bfed3c1")
        && goal.includes("perhand_resunet_heatmap")
        && goal.includes("15,358,485")
        && goal.includes("--model-arch perhand_resunet_heatmap")
        && goal.includes("timeout 21600s brev exec asl-pilot-m3eh-l40s-001")
        && goal.includes("validation PCK@0.10 has never matched run2 validation PCK@0.10 `0.709800`")
        && goal.includes("stop the worker and verify `STOPPED` / `NOT READY`"),
      {
        path: "GOAL.md",
        required_terms: [
          landmarkPckResunetArchitecturePreflightReceiptPath,
          landmarkPckResunetArchitecturePreflightNextAction,
          landmarkPckRun4ResunetG64BrevToken,
          "perhand_resunet_heatmap",
          "--model-arch perhand_resunet_heatmap",
          "timeout 21600s brev exec asl-pilot-m3eh-l40s-001",
        ],
      },
      "GOAL.md must record the completed local ResUNet preflight, exact code hash, and run4 Brev envelope before run4 is the next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_scheduler_preflight_and_run3",
      goal.includes(recognizerSchedulerPreflightReceiptPath)
        && goal.includes(recognizerSchedulerPreflightNextAction)
        && goal.includes(recognizerRun3SchedulerFulltrainNextAction)
        && goal.includes("8a780ae")
        && goal.includes("bfa4ed698da20561e3b3005f56467edec42161f0269e3fc57535c7701b392898")
        && goal.includes("history-best train top-1 `1.000`")
        && goal.includes("train `7011`, monitor `955`, test `2369`")
        && goal.includes("expected optimizer steps `13200`")
        && goal.includes("no checkpoint")
        && goal.includes("no Brev"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerSchedulerPreflightReceiptPath,
          recognizerSchedulerPreflightNextAction,
          recognizerRun3SchedulerFulltrainNextAction,
          "8a780ae",
          "bfa4ed698da20561e3b3005f56467edec42161f0269e3fc57535c7701b392898",
          "history-best train top-1 `1.000`",
          "train `7011`, monitor `955`, test `2369`",
          "expected optimizer steps `13200`",
          "no checkpoint",
          "no Brev",
        ],
      },
      "GOAL.md must record the completed recognizer scheduler preflight, side trainer hash, no-Brev/no-checkpoint boundary, and run3 next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run3_scheduler_fulltrain_result_and_research_next",
      goal.includes(recognizerRun3SchedulerFulltrainReceiptPath)
        && goal.includes(recognizerRun3SchedulerFulltrainNextAction)
        && goal.includes(recognizerRun3ResearchTuningNextAction)
        && goal.includes("test top-1 `0.2984`")
        && goal.includes("top-5 `0.6036`")
        && goal.includes("verification recall@FAR10 `0.7316`")
        && goal.includes("best monitor top-1 `0.378` at epoch `184`")
        && goal.includes("target `>=0.85`")
        && goal.includes("fail-closed")
        && goal.includes("STOPPED` / `NOT READY` / `HEALTHY")
        && goal.includes("bbdd8a16f2e0142b388dbcf5303db05c329ddbbf9ae9ddfea3b1181b4e7deca3")
        && goal.includes("aaecd21c5bde0123d5aee84e65bc40ddbccc65c05ade75887569b92bb431d329"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun3SchedulerFulltrainReceiptPath,
          recognizerRun3SchedulerFulltrainNextAction,
          recognizerRun3ResearchTuningNextAction,
          "test top-1 `0.2984`",
          "top-5 `0.6036`",
          "verification recall@FAR10 `0.7316`",
          "best monitor top-1 `0.378` at epoch `184`",
          "target `>=0.85`",
          "fail-closed",
          "STOPPED` / `NOT READY` / `HEALTHY",
          "bbdd8a16f2e0142b388dbcf5303db05c329ddbbf9ae9ddfea3b1181b4e7deca3",
          "aaecd21c5bde0123d5aee84e65bc40ddbccc65c05ade75887569b92bb431d329",
        ],
      },
      "GOAL.md must record the completed run3 scheduler fulltrain metrics, copied hashes, fail-closed decision, stopped worker, and no-Brev research next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run3_research_tuning_and_t32_next",
      goal.includes(recognizerRun3ResearchTuningReceiptPath)
        && goal.includes(recognizerRun3ResearchTuningArtifactDir)
        && goal.includes(recognizerRun3ResearchTuningNextAction)
        && goal.includes(recognizerT32CacheLoaderPreflightNextAction)
        && goal.includes("gpt-5.5")
        && goal.includes("train loss reached `0.0754`")
        && goal.includes("verification recall@FAR10 remains")
        && goal.includes("T=20 to T=32")
        && goal.includes("did not launch Brev")
        && goal.includes("change final gates"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun3ResearchTuningReceiptPath,
          recognizerRun3ResearchTuningArtifactDir,
          recognizerRun3ResearchTuningNextAction,
          recognizerT32CacheLoaderPreflightNextAction,
          "gpt-5.5",
          "train loss reached `0.0754`",
          "T=20 to T=32",
          "did not launch Brev",
          "change final gates",
        ],
      },
      "GOAL.md must record the completed run3 research tuning, selected T=32 local preflight, artifacts, and no-Brev/no-gate-change boundary",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_t32_cache_loader_preflight_and_materialize_next",
      goal.includes(recognizerT32CacheLoaderPreflightReceiptPath)
        && goal.includes(recognizerT32LoaderDryrunReceiptPath)
        && goal.includes(recognizerT32CacheLoaderPreflightNextAction)
        && goal.includes(recognizerT32CacheMaterializeNextAction)
        && goal.includes("46cd3dd")
        && goal.includes("a45f3294a7d227beacf069638bf0589c66c3d960ad87d1b912ced17ceeec1186")
        && goal.includes("expected sequence length 32 but loaded T 20")
        && goal.includes("logits `[4, 95]`")
        && goal.includes("optimizer steps `0`")
        && goal.includes("no checkpoint")
        && goal.includes("no Brev"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerT32CacheLoaderPreflightReceiptPath,
          recognizerT32LoaderDryrunReceiptPath,
          recognizerT32CacheLoaderPreflightNextAction,
          recognizerT32CacheMaterializeNextAction,
          "46cd3dd",
          "a45f3294a7d227beacf069638bf0589c66c3d960ad87d1b912ced17ceeec1186",
          "expected sequence length 32 but loaded T 20",
          "logits `[4, 95]`",
          "optimizer steps `0`",
          "no checkpoint",
          "no Brev",
        ],
      },
      "GOAL.md must record the completed T=32 loader support preflight, dry-run evidence, side hash, no-Brev/no-checkpoint boundary, and local cache materialization next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_t32_cache_smoke_and_full_cache_next",
      goal.includes(recognizerT32CacheSmokeValidateReceiptPath)
        && goal.includes(recognizerT32CacheSmokeDryrunReceiptPath)
        && goal.includes(recognizerT32CacheMaterializeNextAction)
        && goal.includes(recognizerT32FullCacheMaterializeNextAction)
        && goal.includes("9120")
        && goal.includes("285")
        && goal.includes("95")
        && goal.includes("4a5b90792362a8ffa8498aa0eed6632cf7bb76afa0d8b1d9f61a3c9e3bd51116")
        && goal.includes("logits `[8, 95]`")
        && goal.includes("optimizer steps `0`")
        && goal.includes("no checkpoint")
        && goal.includes("no Brev"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerT32CacheSmokeValidateReceiptPath,
          recognizerT32CacheSmokeDryrunReceiptPath,
          recognizerT32CacheMaterializeNextAction,
          recognizerT32FullCacheMaterializeNextAction,
          "9120",
          "285",
          "95",
          "4a5b90792362a8ffa8498aa0eed6632cf7bb76afa0d8b1d9f61a3c9e3bd51116",
          "logits `[8, 95]`",
          "optimizer steps `0`",
          "no checkpoint",
          "no Brev",
        ],
      },
      "GOAL.md must record the completed T=32 smoke-cache materialization, dry-run evidence, no-Brev/no-checkpoint boundary, and full-cache next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_t32_full_cache_and_run4_next",
      goal.includes(recognizerT32FullCacheValidateReceiptPath)
        && goal.includes(recognizerT32FullCacheDryrunReceiptPath)
        && goal.includes(recognizerT32FullCacheMaterializeNextAction)
        && goal.includes(recognizerRun4T32FulltrainNextAction)
        && goal.includes("330309")
        && goal.includes("10335")
        && goal.includes("95")
        && goal.includes("4dc3f61018a0faf7dccdc7f3653075650683b741bf7d6f7ebde2be878dd9eb9f")
        && goal.includes("logits `[128, 95]`")
        && goal.includes("planned optimizer steps `13200`")
        && goal.includes("no checkpoint")
        && goal.includes("no Brev"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerT32FullCacheValidateReceiptPath,
          recognizerT32FullCacheDryrunReceiptPath,
          recognizerT32FullCacheMaterializeNextAction,
          recognizerRun4T32FulltrainNextAction,
          "330309",
          "10335",
          "95",
          "4dc3f61018a0faf7dccdc7f3653075650683b741bf7d6f7ebde2be878dd9eb9f",
          "logits `[128, 95]`",
          "planned optimizer steps `13200`",
          "no checkpoint",
          "no Brev",
        ],
      },
      "GOAL.md must record the completed full T=32 cache materialization, dry-run evidence, no-Brev/no-checkpoint boundary, and run4 Brev next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run4_t32_worker_preflight_blocker",
      goal.includes(recognizerRun4T32PreflightBlockerReceiptPath)
        && goal.includes(recognizerRun4T32FulltrainNextAction)
        && goal.includes(recognizerRun4T32WaitForHealthyWorkerNextAction)
        && goal.includes("final state `STOPPED` /")
        && goal.includes("`NOT READY` / `UNHEALTHY")
        && goal.includes("No remote")
        && goal.includes("sync, training, checkpoint"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun4T32PreflightBlockerReceiptPath,
          recognizerRun4T32FulltrainNextAction,
          recognizerRun4T32WaitForHealthyWorkerNextAction,
          "final state `STOPPED` /",
          "`NOT READY` / `UNHEALTHY",
          "No remote",
          "sync, training, checkpoint",
        ],
      },
      "GOAL.md must record the run4 T=32 worker preflight blocker, final stopped/unhealthy state, no-training boundary, and wait/infra-approval next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run4_t32_health_refresh_blocker",
      goal.includes(recognizerRun4T32HealthRefreshReceiptPath)
        && goal.includes(recognizerRun4T32WaitForHealthyWorkerNextAction)
        && goal.includes("initial read-only Brev inventory found both existing L40S workspaces were still")
        && goal.includes("`STOPPED` / `NOT READY` / `UNHEALTHY`")
        && goal.includes("Final read-only validation later showed retained")
        && goal.includes("`RUNNING` / `READY` / `HEALTHY`")
        && goal.includes("No Brev lifecycle")
        && goal.includes("not stopped merely because it is `RUNNING` while approved run4 work remains queued"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun4T32HealthRefreshReceiptPath,
          recognizerRun4T32WaitForHealthyWorkerNextAction,
          "initial read-only Brev inventory found both existing L40S workspaces were still",
          "`STOPPED` / `NOT READY` / `UNHEALTHY`",
          "Final read-only validation later showed retained",
          "`RUNNING` / `READY` / `HEALTHY`",
          "No Brev lifecycle",
          "not stopped merely because it is `RUNNING` while approved run4 work remains queued",
        ],
      },
      "GOAL.md must record the run4 T=32 read-only Brev health refresh, no-spend boundary, recovered-worker final observation, and unchanged wait/infra-approval next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run4_t32_fulltrain_result",
      goal.includes(recognizerRun4T32FulltrainReceiptPath)
        && goal.includes(recognizerRun4T32FulltrainNextAction)
        && goal.includes(recognizerRun4ResearchTuningNextAction)
        && goal.includes("0.7626")
        && goal.includes("0.3132")
        && goal.includes("0.6214")
        && goal.includes("best monitor top-1 `0.3927` at epoch `226`")
        && goal.includes("JSON `7ac36c2517d3448526944a21386bee45957e659904bd2d9e6430690f0b71f279`")
        && goal.includes("checkpoint `8ffc6fa5ccc01361a3b466a3c65c1f058ab125db1e9fb8cfc977474ef8ab2dc4`")
        && goal.includes("log `5598205d6fe70bd3c3890c9bbae2db92666916477235281619df4c18312f342e`")
        && goal.includes("final Brev state was `STOPPED` / `NOT READY` / `HEALTHY`")
        && goal.includes("No browser/runtime promotion"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun4T32FulltrainReceiptPath,
          recognizerRun4T32FulltrainNextAction,
          recognizerRun4ResearchTuningNextAction,
          "0.7626",
          "0.3132",
          "0.6214",
          "best monitor top-1 `0.3927` at epoch `226`",
          "JSON `7ac36c2517d3448526944a21386bee45957e659904bd2d9e6430690f0b71f279`",
          "checkpoint `8ffc6fa5ccc01361a3b466a3c65c1f058ab125db1e9fb8cfc977474ef8ab2dc4`",
          "log `5598205d6fe70bd3c3890c9bbae2db92666916477235281619df4c18312f342e`",
          "final Brev state was `STOPPED` / `NOT READY` / `HEALTHY`",
          "No browser/runtime promotion",
        ],
      },
      "GOAL.md must record the completed run4 T=32 Brev fulltrain, copied artifact hashes, stopped worker, fail-closed gate status, and research-tuning next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run4_research_tuning",
      goal.includes(recognizerRun4ResearchTuningReceiptPath)
        && goal.includes(recognizerRun4ResearchTuningArtifactDir)
        && goal.includes(recognizerRun4ResearchTuningNextAction)
        && goal.includes(recognizerRun5SupconPreflightNextAction)
        && goal.includes("supervised contrastive")
        && goal.includes("--supcon-weight")
        && goal.includes("--supcon-temperature")
        && goal.includes("T=40 should wait")
        && goal.includes("No Brev lifecycle")
        && goal.includes("No training run"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun4ResearchTuningReceiptPath,
          recognizerRun4ResearchTuningArtifactDir,
          recognizerRun4ResearchTuningNextAction,
          recognizerRun5SupconPreflightNextAction,
          "supervised contrastive",
          "--supcon-weight",
          "--supcon-temperature",
          "T=40 should wait",
          "No Brev lifecycle",
          "No training run",
        ],
      },
      "GOAL.md must record the run4 no-Brev research tuning pass, GPT/API artifact directory, selected supervised-contrastive local preflight, and no-training/no-Brev boundary",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run5_supcon_preflight",
      goal.includes(recognizerRun5SupconPreflightReceiptPath)
        && goal.includes(recognizerRun5SupconPreflightNextAction)
        && goal.includes(recognizerRun5SupconFulltrainNextAction)
        && goal.includes(recognizerRun5SupconZeroWeightDryrunReceiptPath)
        && goal.includes(recognizerRun5SupconWeight005DryrunReceiptPath)
        && goal.includes("896d5fb")
        && goal.includes("7.84514")
        && goal.includes("4.918027")
        && goal.includes("89")
        && goal.includes("positive anchors")
        && goal.includes("planned paid steps `13200`")
        && goal.includes("No Brev lifecycle")
        && goal.includes("checkpoint")
        && goal.includes("STOPPED` / `NOT READY` / `HEALTHY"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun5SupconPreflightReceiptPath,
          recognizerRun5SupconPreflightNextAction,
          recognizerRun5SupconFulltrainNextAction,
          recognizerRun5SupconZeroWeightDryrunReceiptPath,
          recognizerRun5SupconWeight005DryrunReceiptPath,
          "896d5fb",
          "7.84514",
          "4.918027",
          "positive anchors",
          "planned paid steps `13200`",
          "No Brev lifecycle",
          "STOPPED` / `NOT READY` / `HEALTHY",
        ],
      },
      "GOAL.md must record the run5 SupCon preflight, focused zero-weight and weighted dry-run receipts, no-checkpoint/no-Brev boundary, stopped/healthy worker visibility, and fulltrain next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run5_supcon_fulltrain_result",
      goal.includes(recognizerRun5SupconFulltrainReceiptPath)
        && goal.includes(recognizerRun5SupconFulltrainNextAction)
        && goal.includes(recognizerRun5ResearchTuningNextAction)
        && goal.includes("0.7601")
        && goal.includes("0.3369")
        && goal.includes("0.6235")
        && goal.includes("best monitor top-1 `0.4073` at epoch `178`")
        && goal.includes("JSON `17cd25882093b750c45b58b434f0ea9717cb51564739177fb8eb2c6ae5523158`")
        && goal.includes("checkpoint `7c685a856c1b054b22b53a09cb9a1a4edc51b1c9a41a70b030e2d05aced8ab58`")
        && goal.includes("log `bef427391cc33db8af8e18b5fb679496d7c39b44f14f482290b7230fc6ec7b61`")
        && goal.includes("pretrain dry-run receipt `b7f7b1a7f307af6a492d52b4931c4809dea48c85d73e50277e390b031ba47af2`")
        && goal.includes("final Brev state was `STOPPED` / `NOT READY` / `HEALTHY`")
        && goal.includes("No browser/runtime promotion"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun5SupconFulltrainReceiptPath,
          recognizerRun5SupconFulltrainNextAction,
          recognizerRun5ResearchTuningNextAction,
          "0.7601",
          "0.3369",
          "0.6235",
          "best monitor top-1 `0.4073` at epoch `178`",
          "JSON `17cd25882093b750c45b58b434f0ea9717cb51564739177fb8eb2c6ae5523158`",
          "checkpoint `7c685a856c1b054b22b53a09cb9a1a4edc51b1c9a41a70b030e2d05aced8ab58`",
          "log `bef427391cc33db8af8e18b5fb679496d7c39b44f14f482290b7230fc6ec7b61`",
          "pretrain dry-run receipt `b7f7b1a7f307af6a492d52b4931c4809dea48c85d73e50277e390b031ba47af2`",
          "final Brev state was `STOPPED` / `NOT READY` / `HEALTHY`",
          "No browser/runtime promotion",
        ],
      },
      "GOAL.md must record the completed run5 SupCon Brev fulltrain, copied artifact hashes, stopped worker, fail-closed gate status, and no-Brev research-tuning next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run5_research_tuning_and_run6_preflight",
      goal.includes(recognizerRun5ResearchTuningReceiptPath)
        && goal.includes(recognizerRun5ResearchTuningArtifactDir)
        && goal.includes(recognizerRun5ResearchTuningNextAction)
        && goal.includes(recognizerRun6VerificationMarginPreflightNextAction)
        && goal.includes("metric-alignment")
        && goal.includes("per-class softmax score tails")
        && goal.includes("monitor_verification_recall_far10")
        && goal.includes("0.7601")
        && goal.includes("0.7626")
        && goal.includes("No Brev lifecycle")
        && goal.includes("do not tune SupCon harder"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun5ResearchTuningReceiptPath,
          recognizerRun5ResearchTuningArtifactDir,
          recognizerRun5ResearchTuningNextAction,
          recognizerRun6VerificationMarginPreflightNextAction,
          "metric-alignment",
          "per-class softmax score tails",
          "monitor_verification_recall_far10",
          "0.7601",
          "0.7626",
          "No Brev lifecycle",
          "do not tune SupCon harder",
        ],
      },
      "GOAL.md must record the completed run5 no-Brev research tuning pass, GPT/API artifact directory, selected verification-margin and monitor-verification selection preflight, stopped Brev visibility, and no-training/no-Brev boundary",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run6_verification_margin_preflight_and_fulltrain_next",
      goal.includes(recognizerRun6VerificationMarginPreflightReceiptPath)
        && goal.includes(recognizerRun6VerificationMarginDiagnosticReceiptPath)
        && goal.includes(recognizerRun6VerifselectDryrunReceiptPath)
        && goal.includes(recognizerRun6VerificationMarginPreflightNextAction)
        && goal.includes(recognizerRun6VerifselectFulltrainNextAction)
        && goal.includes("0f54967")
        && goal.includes("--checkpoint-metric monitor_verification_recall_far10")
        && goal.includes("--save-best-checkpoint")
        && goal.includes("0.762615")
        && goal.includes("0.760931")
        && goal.includes("0.791417")
        && goal.includes("0.787897")
        && goal.includes("optimizer steps `13200`")
        && goal.includes("weights: null")
        && goal.includes("No Brev lifecycle")
        && goal.includes("STOPPED` / `NOT READY` / `HEALTHY"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun6VerificationMarginPreflightReceiptPath,
          recognizerRun6VerificationMarginDiagnosticReceiptPath,
          recognizerRun6VerifselectDryrunReceiptPath,
          recognizerRun6VerificationMarginPreflightNextAction,
          recognizerRun6VerifselectFulltrainNextAction,
          "0f54967",
          "--checkpoint-metric monitor_verification_recall_far10",
          "--save-best-checkpoint",
          "0.762615",
          "0.760931",
          "0.791417",
          "0.787897",
          "optimizer steps `13200`",
          "weights: null",
          "STOPPED` / `NOT READY` / `HEALTHY",
        ],
      },
      "GOAL.md must record the run6 verification-margin preflight, diagnostic/dry-run receipts, side commit, monitor/test verification results, no-checkpoint/no-Brev boundary, and run6 fulltrain next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run6_t32_preflight_deferred_and_retry_next",
      goal.includes(recognizerRun6T32PreflightBlockerReceiptPath)
        && goal.includes(recognizerRun6VerifselectFulltrainNextAction)
        && goal.includes("session 935")
        && goal.includes("exited `124`")
        && goal.includes("before any remote sync")
        && goal.includes("UNHEALTHY` / `READY` / `UNHEALTHY")
        && goal.includes("STOPPED` / `NOT READY` / `UNHEALTHY")
        && goal.includes("RUNNING` / `READY` / `HEALTHY")
        && goal.includes("STOPPED` / `NOT READY` / `HEALTHY")
        && goal.includes("stopped for cost control")
        && goal.includes("No destructive infrastructure action was taken")
        && goal.includes("explicit human approval before creating, deleting, resetting, or repairing Brev infrastructure"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun6T32PreflightBlockerReceiptPath,
          recognizerRun6VerifselectFulltrainNextAction,
          "session 935",
          "exited `124`",
          "before any remote sync",
          "UNHEALTHY` / `READY` / `UNHEALTHY",
          "STOPPED` / `NOT READY` / `UNHEALTHY",
          "RUNNING` / `READY` / `HEALTHY",
          "STOPPED` / `NOT READY` / `HEALTHY",
          "stopped for cost control",
          "No destructive infrastructure action was taken",
        ],
      },
      "GOAL.md must record the run6 fulltrain preflight timeout, late worker recovery, stopped/healthy final state, no-sync/no-training boundary, and retry-fulltrain next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run6_verifselect_fulltrain_and_research_next",
      goal.includes(recognizerRun6VerifselectFulltrainReceiptPath)
        && goal.includes(recognizerRun6VerifselectFulltrainNextAction)
        && goal.includes(recognizerRun6ResearchTuningNextAction)
        && goal.includes("session 936")
        && goal.includes("0.8039")
        && goal.includes("0.287")
        && goal.includes("0.6399")
        && goal.includes("0.8169")
        && goal.includes("epoch `14`")
        && goal.includes("expected/actual optimizer steps `13200`")
        && goal.includes("889fd3220960c8a6fd33bd9b44c34bb47a356588498a060386db04f1b7767ba3")
        && goal.includes("STOPPED` / `NOT READY` / `HEALTHY")
        && goal.includes("fail-closed")
        && goal.includes("before any paid run7"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun6VerifselectFulltrainReceiptPath,
          recognizerRun6VerifselectFulltrainNextAction,
          recognizerRun6ResearchTuningNextAction,
          "session 936",
          "0.8039",
          "0.287",
          "0.6399",
          "0.8169",
          "epoch `14`",
          "expected/actual optimizer steps `13200`",
          "889fd3220960c8a6fd33bd9b44c34bb47a356588498a060386db04f1b7767ba3",
          "STOPPED` / `NOT READY` / `HEALTHY",
          "before any paid run7",
        ],
      },
      "GOAL.md must record completed run6 verification-selection fulltrain, copied artifact hashes, best monitor-verification checkpoint selection, fail-closed gate status, stopped worker, and no-Brev research-tuning next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run6_research_tuning_and_run7_tail_audit_next",
      goal.includes(recognizerRun6ResearchTuningReceiptPath)
        && goal.includes(recognizerRun6ResearchTuningArtifactDir)
        && goal.includes(recognizerRun6ResearchTuningNextAction)
        && goal.includes(recognizerRun7VerificationTailAuditNextAction)
        && goal.includes(recognizerRun7ClassBalancedCeFulltrainNextAction)
        && goal.includes("session 937")
        && goal.includes("resp_0ded03e26cd18905006a21042a4e5081949efd9c2f60c581af")
        && goal.includes("gpt-5.5-2026-04-23")
        && goal.includes("8857")
        && goal.includes("3106")
        && goal.includes("0.8169")
        && goal.includes("0.8039")
        && goal.includes("score-tail")
        && goal.includes("teacher-coverage imbalance")
        && goal.includes("abs `<=0.002` of `0.8039`")
        && goal.includes("beta 0.999")
        && goal.includes("max weight `4.0`")
        && goal.includes("Do not launch run7"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun6ResearchTuningReceiptPath,
          recognizerRun6ResearchTuningArtifactDir,
          recognizerRun6ResearchTuningNextAction,
          recognizerRun7VerificationTailAuditNextAction,
          recognizerRun7ClassBalancedCeFulltrainNextAction,
          "session 937",
          "resp_0ded03e26cd18905006a21042a4e5081949efd9c2f60c581af",
          "gpt-5.5-2026-04-23",
          "0.8169",
          "0.8039",
          "teacher-coverage imbalance",
          "abs `<=0.002` of `0.8039`",
          "Do not launch run7",
        ],
      },
      "GOAL.md must record completed run6 research tuning, GPT/API artifacts, selected no-Brev verification-tail audit, gated class-balanced run7 candidate, no-training/no-Brev boundary, and no-launch warning",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run7_tail_audit_and_hard_negative_research_next",
      goal.includes(recognizerRun7VerificationTailAuditReceiptPath)
        && goal.includes(recognizerRun7VerificationTailDiagnosticReceiptPath)
        && goal.includes(recognizerRun7VerificationTailAuditNextAction)
        && goal.includes(recognizerRun7HardNegativeObjectiveResearchNextAction)
        && goal.includes("session 938")
        && goal.includes("0.8038559556786704")
        && goal.includes("0.000044")
        && goal.includes("not_proven")
        && goal.includes("5 of the top 10")
        && goal.includes("give")
        && goal.includes("airplane")
        && goal.includes("milk")
        && goal.includes("hungry / please")
        && goal.includes("Do not launch class-balanced CE run7"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun7VerificationTailAuditReceiptPath,
          recognizerRun7VerificationTailDiagnosticReceiptPath,
          recognizerRun7VerificationTailAuditNextAction,
          recognizerRun7HardNegativeObjectiveResearchNextAction,
          "session 938",
          "0.8038559556786704",
          "not_proven",
          "5 of the top 10",
          "hungry / please",
          "Do not launch class-balanced CE run7",
        ],
      },
      "GOAL.md must record completed run7 verification-tail audit, reproduced run6 recall, not-proven count/coverage constraint, hard-negative tail evidence, and the no-Brev research next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run7_hard_negative_research_and_ovr_bce_next",
      goal.includes(recognizerRun7HardNegativeObjectiveResearchReceiptPath)
        && goal.includes(recognizerRun7HardNegativeObjectiveResearchArtifactDir)
        && goal.includes(recognizerRun7HardNegativeObjectiveResearchNextAction)
        && goal.includes(recognizerRun7OvrBceHardnegPreflightNextAction)
        && goal.includes(recognizerRun7OvrBceHardnegFulltrainNextAction)
        && goal.includes("session 939")
        && goal.includes("resp_01ecb85353047dea006a210c8ca0cc8197804703931d228b1d")
        && goal.includes("gpt-5.5-2026-04-23")
        && goal.includes("11645")
        && goal.includes("4422")
        && goal.includes("--ovr-bce-weight")
        && goal.includes("--ovr-bce-hard-k 8")
        && goal.includes("uses_test_mined_pairs_for_training: false")
        && goal.includes("class-balanced CE")
        && goal.includes("T=40"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun7HardNegativeObjectiveResearchReceiptPath,
          recognizerRun7HardNegativeObjectiveResearchArtifactDir,
          recognizerRun7HardNegativeObjectiveResearchNextAction,
          recognizerRun7OvrBceHardnegPreflightNextAction,
          recognizerRun7OvrBceHardnegFulltrainNextAction,
          "session 939",
          "resp_01ecb85353047dea006a210c8ca0cc8197804703931d228b1d",
          "--ovr-bce-weight",
          "uses_test_mined_pairs_for_training: false",
        ],
      },
      "GOAL.md must record completed run7 hard-negative objective research, GPT/API artifacts, selected OVR-BCE hard-negative preflight, and no-Brev/no-training boundaries",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run7_ovr_bce_preflight_and_fulltrain_next",
      goal.includes(recognizerRun7OvrBceHardnegPreflightReceiptPath)
        && goal.includes(recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptPath)
        && goal.includes(recognizerRun7OvrBceHardnegWeight003DryrunReceiptPath)
        && goal.includes(recognizerRun7OvrBceHardnegPreflightNextAction)
        && goal.includes(recognizerRun7OvrBceHardnegFulltrainNextAction)
        && goal.includes("session 940")
        && goal.includes("828f5cf5")
        && goal.includes("0.047071")
        && goal.includes("1024")
        && goal.includes("selected_negative_matches_true_label")
        && goal.includes("Next action: `m3jb_recognizer_transformer_run7_ovr_bce_hardneg_fulltrain_brev_ok`"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun7OvrBceHardnegPreflightReceiptPath,
          recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptPath,
          recognizerRun7OvrBceHardnegWeight003DryrunReceiptPath,
          recognizerRun7OvrBceHardnegFulltrainNextAction,
          "session 940",
          "828f5cf5",
          "0.047071",
          "selected_negative_matches_true_label",
        ],
      },
      "GOAL.md must record completed run7 OVR-BCE hard-negative preflight, dry-run receipts, side commit, no-training proof, and the gated full-train next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run7_ovr_bce_fulltrain_and_research_next",
      goal.includes(recognizerRun7OvrBceHardnegFulltrainReceiptPath)
        && goal.includes(recognizerRun7OvrBceHardnegFulltrainNextAction)
        && goal.includes(recognizerRun7OvrBceResearchTuningNextAction)
        && goal.includes("session 941")
        && goal.includes("0.7759")
        && goal.includes("0.8039")
        && goal.includes("13200")
        && goal.includes("STOPPED")
        && goal.includes("no-Brev research/postmortem"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun7OvrBceHardnegFulltrainReceiptPath,
          recognizerRun7OvrBceHardnegFulltrainNextAction,
          recognizerRun7OvrBceResearchTuningNextAction,
          "session 941",
          "0.7759",
          "0.8039",
          "STOPPED",
        ],
      },
      "GOAL.md must record completed run7 OVR-BCE Brev fulltrain, fail-closed regression versus run6, stopped worker, and no-Brev research/postmortem next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run7_ovr_bce_research_tuning_and_calibration_audit_next",
      goal.includes(recognizerRun7OvrBceResearchTuningReceiptPath)
        && goal.includes(recognizerRun7OvrBceResearchTuningNextAction)
        && goal.includes(recognizerRun6VsRun7CalibrationAuditNextAction)
        && goal.includes("session 942")
        && goal.includes("resp_077b7bdd7c4483eb006a211f48d0ec81979b381333045daf88")
        && goal.includes("gpt-5.5-2026-04-23")
        && goal.includes("0.8276")
        && goal.includes("0.7759")
        && goal.includes("0.8039")
        && goal.includes("OVR-BCE weight 0.01")
        && goal.includes("no-Brev paired calibration audit"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun7OvrBceResearchTuningReceiptPath,
          recognizerRun7OvrBceResearchTuningNextAction,
          recognizerRun6VsRun7CalibrationAuditNextAction,
          "session 942",
          "resp_077b7bdd7c4483eb006a211f48d0ec81979b381333045daf88",
          "0.8276",
          "0.7759",
          "0.8039",
        ],
      },
      "GOAL.md must record completed run7 OVR-BCE research/postmortem, gpt-5.5 response evidence, selected paired calibration audit next action, and gated run8 weight-0.01 candidate",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run6_vs_run7_calibration_audit_failed_reproduction_next",
      goal.includes(recognizerRun6VsRun7CalibrationAuditReceiptPath)
        && goal.includes(recognizerRun6VsRun7CalibrationDetailedReceiptPath)
        && goal.includes(recognizerRun6VsRun7CalibrationAuditNextAction)
        && goal.includes(recognizerRun7TestRecallReproductionDiscrepancyNextAction)
        && goal.includes("session 943")
        && goal.includes("bfd1e783")
        && goal.includes("0.7750692520775622")
        && goal.includes("0.0008307479224378689")
        && goal.includes("does **not** authorize paid")
        && goal.includes("run8"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun6VsRun7CalibrationAuditReceiptPath,
          recognizerRun6VsRun7CalibrationDetailedReceiptPath,
          recognizerRun6VsRun7CalibrationAuditNextAction,
          recognizerRun7TestRecallReproductionDiscrepancyNextAction,
          "session 943",
          "bfd1e783",
          "0.7750692520775622",
        ],
      },
      "GOAL.md must record completed run6-vs-run7 paired calibration audit, failed run7 reproduction tolerance, no run8 authorization, and no-Brev discrepancy next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run7_test_recall_discrepancy_resolution_next_preflight",
      goal.includes(recognizerRun7TestRecallReproductionDiscrepancyReceiptPath)
        && goal.includes(recognizerRun7TestRecallReproductionDiscrepancyNextAction)
        && goal.includes(recognizerRun8OvrBceW001PreflightNextAction)
        && goal.includes("RUN7 TEST-RECALL REPRODUCTION DISCREPANCY AUDIT RESULT")
        && goal.includes("session 944")
        && goal.includes("0.7759113573407201")
        && goal.includes("0.7750692520775622")
        && goal.includes("0.0008421052631579")
        && goal.includes("not")
        && goal.includes("see")
        && goal.includes("93/95")
        && goal.includes("CPU-vs-original-CUDA numerical boundary sensitivity")
        && goal.includes("did not launch or authorize paid run8")
        && goal.includes("OVR-BCE weight `0.01`"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun7TestRecallReproductionDiscrepancyReceiptPath,
          recognizerRun7TestRecallReproductionDiscrepancyNextAction,
          recognizerRun8OvrBceW001PreflightNextAction,
          "session 944",
          "0.7759113573407201",
          "0.0008421052631579",
          "CPU-vs-original-CUDA numerical boundary sensitivity",
        ],
      },
      "GOAL.md must record completed run7 test-recall discrepancy resolution, two-class threshold-boundary cause, no paid run8 launch/authorization, and no-Brev run8 w0.01 preflight next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run8_ovr_bce_w001_preflight_complete_next_fulltrain",
      goal.includes(recognizerRun8OvrBceW001PreflightReceiptPath)
        && goal.includes(recognizerRun8OvrBceW001DryrunReceiptPath)
        && goal.includes(recognizerRun8OvrBceW001PreflightNextAction)
        && goal.includes(recognizerRun8OvrBceW001FulltrainNextAction)
        && goal.includes("RUN8 OVR-BCE W0.01 PREFLIGHT RESULT")
        && goal.includes("session 945")
        && goal.includes("0.01569")
        && goal.includes("7.86083")
        && goal.includes("selected_negative_matches_true_label: 0")
        && goal.includes("uses_test_mined_pairs_for_training: false")
        && goal.includes("Read-only `brev ls --json` showed both L40S")
        && goal.includes("bounded fulltrain envelope"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun8OvrBceW001PreflightReceiptPath,
          recognizerRun8OvrBceW001DryrunReceiptPath,
          recognizerRun8OvrBceW001PreflightNextAction,
          recognizerRun8OvrBceW001FulltrainNextAction,
          "session 945",
          "0.01569",
          "7.86083",
        ],
      },
      "GOAL.md must record completed run8 OVR-BCE w0.01 no-Brev preflight, key dry-run invariants, stopped Brev visibility, and bounded fulltrain next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run8_ovr_bce_w001_brev_preflight_blocker_next_fulltrain_retry",
      goal.includes(recognizerRun8OvrBceW001PreflightBlockerReceiptPath)
        && goal.includes(recognizerRun8OvrBceW001FulltrainNextAction)
        && goal.includes("RUN8 OVR-BCE W0.01 FULLTRAIN PREFLIGHT BLOCKER")
        && goal.includes("session 946")
        && goal.includes("SSH preflight never became reachable")
        && goal.includes("later read-only final inventory")
        && goal.includes("recovered to `RUNNING` / `READY` / `HEALTHY`")
        && goal.includes("not stopped merely because approved run8 work remains queued")
        && goal.includes("CUDA/process preflight")
        && goal.includes("sync/hash verification")
        && goal.includes("optimizer/backward")
        && goal.includes("final-gate change")
        && goal.includes("`brev stop --all`")
        && goal.includes("Do not create, delete, reset, or repair Brev infrastructure without explicit human approval"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun8OvrBceW001PreflightBlockerReceiptPath,
          recognizerRun8OvrBceW001FulltrainNextAction,
          "session 946",
          "SSH preflight never became reachable",
          "recovered to `RUNNING` / `READY` / `HEALTHY`",
          "Do not create, delete, reset, or repair Brev infrastructure without explicit human approval",
        ],
      },
      "GOAL.md must record the run8 Brev SSH preflight blocker, no-training/no-gate-change boundaries, teardown, late worker recovery, and bounded fulltrain retry next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run8_ovr_bce_w001_fulltrain_and_research_next",
      goal.includes(recognizerRun8OvrBceW001FulltrainReceiptPath)
        && goal.includes(recognizerRun8OvrBceW001ResearchTuningNextAction)
        && goal.includes("RUN8 OVR-BCE W0.01 FULLTRAIN RESULT")
        && goal.includes("session 947")
        && goal.includes("verification recall@FAR10 `0.7571`")
        && goal.includes("top-1 `0.3081`")
        && goal.includes("top-5 `0.6079`")
        && goal.includes("best monitor-verification checkpoint was epoch `83`")
        && goal.includes("best score `0.8252875272322179`")
        && goal.includes("Brev API auth became unavailable")
        && goal.includes("SSH was unreachable after OS shutdown")
        && goal.includes("Do not launch another paid run blindly"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun8OvrBceW001FulltrainReceiptPath,
          recognizerRun8OvrBceW001ResearchTuningNextAction,
          "session 947",
          "verification recall@FAR10 `0.7571`",
          "Brev API auth became unavailable",
          "Do not launch another paid run blindly",
        ],
      },
      "GOAL.md must record completed run8 OVR-BCE w0.01 fulltrain, fail-closed metrics, copyback/teardown caveat, and no-Brev research next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run8_ovr_bce_w001_research_tuning_and_three_run_audit_next",
      goal.includes(recognizerRun8OvrBceW001ResearchTuningReceiptPath)
        && goal.includes(recognizerRun8OvrBceW001ResearchTuningNextAction)
        && goal.includes(recognizerRun6Run7Run8CalibrationTailAuditNextAction)
        && goal.includes("RUN8 OVR-BCE W0.01 RESEARCH/POSTMORTEM RESULT")
        && goal.includes("session 948")
        && goal.includes("stop OVR-BCE for now")
        && goal.includes("no paid recipe yet")
        && goal.includes("Brev auth recovery")
        && goal.includes("run6/run7/run8 verification calibration-tail"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun8OvrBceW001ResearchTuningReceiptPath,
          recognizerRun8OvrBceW001ResearchTuningNextAction,
          recognizerRun6Run7Run8CalibrationTailAuditNextAction,
          "session 948",
          "stop OVR-BCE for now",
          "no paid recipe yet",
          "Brev auth recovery",
        ],
      },
      "GOAL.md must record completed run8 OVR-BCE research/postmortem, no-Brev/no-training boundaries, no paid recipe yet, Brev auth prerequisite, and the three-run calibration-tail audit next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run6_run7_run8_calibration_tail_audit_next_research",
      goal.includes(recognizerRun6Run7Run8CalibrationTailAuditReceiptPath)
        && goal.includes(recognizerRun6Run7Run8CalibrationTailDetailedReceiptPath)
        && goal.includes(recognizerRun6Run7Run8CalibrationTailAuditNextAction)
        && goal.includes(recognizerPostOvrBceCalibrationSafeResearchNextAction)
        && goal.includes("session 949")
        && goal.includes("ad16b00d")
        && goal.includes("0.8038559556786704")
        && goal.includes("0.7750692520775622")
        && goal.includes("0.7571191135734074")
        && goal.includes("broader positive-margin damage")
        && goal.includes("localized positive-margin damage")
        && goal.includes("run7 is best by monitor")
        && goal.includes("run6 is best by held-out test")
        && goal.includes("no paid recipe"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun6Run7Run8CalibrationTailAuditReceiptPath,
          recognizerRun6Run7Run8CalibrationTailDetailedReceiptPath,
          recognizerRun6Run7Run8CalibrationTailAuditNextAction,
          recognizerPostOvrBceCalibrationSafeResearchNextAction,
          "session 949",
          "ad16b00d",
          "broader positive-margin damage",
          "localized positive-margin damage",
        ],
      },
      "GOAL.md must record completed run6/run7/run8 calibration-tail audit, monitor-vs-test mismatch, no paid recipe, and next no-Brev calibration-safe research action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_post_ovr_bce_calibration_safe_research_next_preflight",
      goal.includes(recognizerPostOvrBceCalibrationSafeResearchReceiptPath)
        && goal.includes(recognizerPostOvrBceCalibrationSafeResearchNextAction)
        && goal.includes(recognizerRun6MonitorSelectionStabilityPreflightNextAction)
        && goal.includes("session 950")
        && goal.includes("resp_0701b4689f25eb29006a214576dcac8197b1f838ad45dbf2b5")
        && goal.includes("run6 monitor/checkpoint-selection stability preflight")
        && goal.includes("no paid recipe yet")
        && goal.includes("Brev auth recovery"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerPostOvrBceCalibrationSafeResearchReceiptPath,
          recognizerPostOvrBceCalibrationSafeResearchNextAction,
          recognizerRun6MonitorSelectionStabilityPreflightNextAction,
          "session 950",
          "resp_0701b4689f25eb29006a214576dcac8197b1f838ad45dbf2b5",
          "run6 monitor/checkpoint-selection stability preflight",
          "no paid recipe yet",
        ],
      },
      "GOAL.md must record completed post-OVR-BCE calibration-safe research, no paid recipe, Brev auth prerequisite, and next run6 monitor-selection stability preflight",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run6_monitor_selection_stability_preflight_next_retention",
      goal.includes(recognizerRun6MonitorSelectionStabilityPreflightReceiptPath)
        && goal.includes(recognizerRun6MonitorSelectionStabilityDetailedReceiptPath)
        && goal.includes(recognizerRun6MonitorSelectionStabilityPreflightNextAction)
        && goal.includes(recognizerCandidateCheckpointRetentionPreflightNextAction)
        && goal.includes("session 951")
        && goal.includes("epoch `31`")
        && goal.includes("alternate_epoch_checkpoint_count: 0")
        && goal.includes("per_epoch_logits_count: 0")
        && goal.includes("no paid recipe is selected")
        && goal.includes("Brev auth recovery"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun6MonitorSelectionStabilityPreflightReceiptPath,
          recognizerRun6MonitorSelectionStabilityDetailedReceiptPath,
          recognizerRun6MonitorSelectionStabilityPreflightNextAction,
          recognizerCandidateCheckpointRetentionPreflightNextAction,
          "session 951",
          "epoch `31`",
          "alternate_epoch_checkpoint_count: 0",
          "per_epoch_logits_count: 0",
        ],
      },
      "GOAL.md must record completed run6 monitor-selection stability preflight, artifact insufficiency for epoch 31, no paid recipe, Brev auth prerequisite, and next candidate-checkpoint retention preflight",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_candidate_checkpoint_retention_preflight_next_research",
      goal.includes(recognizerCandidateCheckpointRetentionPreflightReceiptPath)
        && goal.includes(recognizerCandidateCheckpointRetentionDryrunReceiptPath)
        && goal.includes(recognizerCandidateCheckpointRetentionPreflightNextAction)
        && goal.includes(recognizerRetentionEnabledResearchTuningNextAction)
        && goal.includes("session 952")
        && goal.includes("candidate checkpoint retention")
        && goal.includes("planned optimizer steps `13200`")
        && goal.includes("checkpoint_write_blocker: `dry_run_forward`")
        && goal.includes("retained_checkpoint_count: 0")
        && goal.includes("no paid recipe is selected")
        && goal.includes("Brev auth recovery"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerCandidateCheckpointRetentionPreflightReceiptPath,
          recognizerCandidateCheckpointRetentionDryrunReceiptPath,
          recognizerCandidateCheckpointRetentionPreflightNextAction,
          recognizerRetentionEnabledResearchTuningNextAction,
          "session 952",
          "checkpoint_write_blocker: `dry_run_forward`",
          "retained_checkpoint_count: 0",
        ],
      },
      "GOAL.md must record completed candidate checkpoint retention preflight, no checkpoint write, no paid recipe, Brev auth prerequisite, and next no-Brev research/tuning action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_retention_enabled_research_tuning_next_run9_preflight",
      goal.includes(recognizerRetentionEnabledResearchTuningReceiptPath)
        && goal.includes(recognizerRetentionEnabledResearchTuningArtifactDir)
        && goal.includes(recognizerRetentionEnabledResearchTuningNextAction)
        && goal.includes(recognizerRun9RetentionEnabledRun6RecipePreflightNextAction)
        && goal.includes("session 953")
        && goal.includes("resp_0c05446d4cf7fa7b006a214fd83d4881969db35a0dcba78d49")
        && goal.includes("record_run9_retention_enabled_run6_recipe")
        && goal.includes("no paid fulltrain")
        && goal.includes("Brev auth recovery"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRetentionEnabledResearchTuningReceiptPath,
          recognizerRetentionEnabledResearchTuningArtifactDir,
          recognizerRetentionEnabledResearchTuningNextAction,
          recognizerRun9RetentionEnabledRun6RecipePreflightNextAction,
          "session 953",
          "record_run9_retention_enabled_run6_recipe",
        ],
      },
      "GOAL.md must record completed retention-enabled research tuning, gpt-5.5 fallback artifacts, no paid fulltrain authorization, Brev auth prerequisite, and next run9 retention recipe preflight",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run9_retention_enabled_recipe_preflight_next_auth",
      goal.includes(recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath)
        && goal.includes(recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath)
        && goal.includes(recognizerRun9RetentionEnabledRun6RecipePreflightNextAction)
        && goal.includes(recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction)
        && goal.includes(recognizerRun9RetentionEnabledRun6FulltrainAfterAuthNextAction)
        && goal.includes("session 954")
        && goal.includes("zero optimizer/backward steps")
        && goal.includes("future compute envelope")
        && goal.includes("Brev auth")
        && goal.includes("successful `brev ls --json`"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath,
          recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath,
          recognizerRun9RetentionEnabledRun6RecipePreflightNextAction,
          recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction,
          recognizerRun9RetentionEnabledRun6FulltrainAfterAuthNextAction,
          "session 954",
          "zero optimizer/backward steps",
        ],
      },
      "GOAL.md must record completed run9 retention-enabled run6 recipe preflight, no-save dry-run evidence, future envelope/kill criteria, Brev auth blocker, and next no-spend Brev visibility refresh",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run9_brev_auth_visibility_blocker",
      goal.includes(recognizerRun9BrevAuthVisibilityRefreshReceiptPath)
        && goal.includes(recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction)
        && goal.includes(recognizerRun9RetentionEnabledAwaitBrevLoginNextAction)
        && goal.includes("session 955")
        && goal.includes("brev ls --json")
        && goal.includes("exit `1`")
        && goal.includes("You are currently logged out")
        && goal.includes("EOF")
        && goal.includes("future run9 fulltrain remains blocked"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun9BrevAuthVisibilityRefreshReceiptPath,
          recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction,
          recognizerRun9RetentionEnabledAwaitBrevLoginNextAction,
          "session 955",
          "You are currently logged out",
          "future run9 fulltrain remains blocked",
        ],
      },
      "GOAL.md must record completed run9 Brev auth visibility refresh, the logged-out/EOF blocker, no lifecycle/spend, and the human login next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run9_brev_auth_visibility_retry_blocker",
      goal.includes(recognizerRun9BrevAuthVisibilityRetryReceiptPath)
        && goal.includes(recognizerRun9BrevAuthVisibilityRefreshReceiptPath)
        && goal.includes(recognizerRun9RetentionEnabledAwaitBrevLoginNextAction)
        && goal.includes("session 956")
        && goal.includes("still logged out")
        && goal.includes("brev ls --json")
        && goal.includes("exit `1`")
        && goal.includes("You are currently logged out")
        && goal.includes("EOF")
        && goal.includes("future run9 fulltrain remains blocked"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun9BrevAuthVisibilityRetryReceiptPath,
          recognizerRun9BrevAuthVisibilityRefreshReceiptPath,
          recognizerRun9RetentionEnabledAwaitBrevLoginNextAction,
          "session 956",
          "still logged out",
          "You are currently logged out",
          "future run9 fulltrain remains blocked",
        ],
      },
      "GOAL.md must record completed run9 Brev auth visibility retry, the still-logged-out/EOF blocker, no lifecycle/spend, and the unchanged human login next action",
    );
    addCheck(
      checks,
      blockers,
      "goal_records_recognizer_run9_brev_auth_human_login_boundary",
      goal.includes(recognizerRun9BrevAuthHumanLoginBoundaryReceiptPath)
        && goal.includes(recognizerRun9BrevAuthVisibilityRetryReceiptPath)
        && goal.includes(recognizerRun9RetentionEnabledWaitForHumanBrevLoginNextAction)
        && goal.includes(recognizerRun9RetentionEnabledAwaitBrevLoginNextAction)
        && goal.includes("session 958")
        && goal.includes("no further automated Brev CLI visibility retries")
        && goal.includes("human explicitly confirms")
        && goal.includes("You are currently logged out")
        && goal.includes("future run9 fulltrain remains blocked"),
      {
        path: "GOAL.md",
        required_terms: [
          recognizerRun9BrevAuthHumanLoginBoundaryReceiptPath,
          recognizerRun9BrevAuthVisibilityRetryReceiptPath,
          recognizerRun9RetentionEnabledWaitForHumanBrevLoginNextAction,
          recognizerRun9RetentionEnabledAwaitBrevLoginNextAction,
          "session 958",
          "no further automated Brev CLI visibility retries",
          "human explicitly confirms",
          "future run9 fulltrain remains blocked",
        ],
      },
      "GOAL.md must record the run9 Brev auth human-login boundary, stop further automated visibility retries until explicit human confirmation, and preserve no-spend/no-lifecycle boundaries",
    );
  }

  if (exists(architectureFilePath)) {
    const architecture = readProject(architecturePath);
    addCheck(
      checks,
      blockers,
      "architecture_records_brev_compute_policy",
      architecture.includes("Do not reduce final training/evaluation scope")
        && architecture.includes("Brev/NVIDIA compute")
        && architecture.includes("Do not shrink final model-candidate training/evaluation scope"),
      {
        path: architecturePath,
        required_terms: [
          "Do not reduce final training/evaluation scope",
          "Brev/NVIDIA compute",
          "Do not shrink final model-candidate training/evaluation scope",
        ],
      },
      "ARCHITECTURE.md must record the Brev compute authorization and no-artificial-downsize policy",
    );
  }

  const computePolicyReceipt = exists(computePolicyReceiptFilePath)
    ? readJson(computePolicyReceiptFilePath)
    : {};
  addCheck(
    checks,
    blockers,
    "compute_policy_receipt_records_authorization",
    computePolicyReceipt.status === "accepted"
      && computePolicyReceipt.policy?.brev_nvidia_compute_authorized === true
      && computePolicyReceipt.policy?.do_not_downsize_for_local_runtime === true,
    {
      path: computePolicyReceiptPath,
      status: computePolicyReceipt.status ?? null,
      brev_nvidia_compute_authorized:
        computePolicyReceipt.policy?.brev_nvidia_compute_authorized ?? null,
      do_not_downsize_for_local_runtime:
        computePolicyReceipt.policy?.do_not_downsize_for_local_runtime ?? null,
    },
    "compute policy receipt must record accepted Brev authorization and no-artificial-downsize policy",
  );

  if (exists(bundlePath) && exists(detectorCardPath)) {
    const bundle = readJson(bundlePath);
    const detectorCard = readJson(detectorCardPath);
    addCheck(
      checks,
      blockers,
      "browser_runtime_fail_closed",
      bundle.recognition?.enabled === false
        && bundle.detector0_tracking?.enabled === false
        && bundle.detector0_tracking?.browser_artifact === null
        && detectorCard.status === "not_trained"
        && detectorCard.browser_artifact === null,
      {
        recognition_enabled: bundle.recognition?.enabled,
        detector0_tracking_enabled: bundle.detector0_tracking?.enabled,
        detector0_browser_artifact: bundle.detector0_tracking?.browser_artifact,
        detector_card_status: detectorCard.status,
        detector_card_browser_artifact: detectorCard.browser_artifact,
      },
      "browser runtime must remain fail-closed while M3JB gates are open",
    );
    addCheck(
      checks,
      blockers,
      "detector_card_no_pretrained_components",
      Array.isArray(detectorCard.architecture?.pretrained_components)
        && detectorCard.architecture.pretrained_components.length === 0,
      { pretrained_components: detectorCard.architecture?.pretrained_components },
      "detector0-card declares pretrained components",
    );
  }

  for (const [id, filePath] of Object.entries(sideReceipts)) {
    addCheck(
      checks,
      blockers,
      `${id}_exists`,
      exists(filePath),
      { path: rel(filePath) },
      `required side-worktree receipt is missing: ${filePath}`,
    );
  }
  for (const [id, filePath] of Object.entries(webPreviewEvidence)) {
    addCheck(
      checks,
      blockers,
      `web_preview_${id}_exists`,
      exists(filePath),
      { path: rel(filePath) },
      `required browser product-gate evidence file is missing: ${filePath}`,
    );
  }

  const detector = exists(sideReceipts.detectorDistinct) ? readJson(sideReceipts.detectorDistinct) : {};
  const ranker = exists(sideReceipts.pairRankerCropPose) ? readJson(sideReceipts.pairRankerCropPose) : {};
  const landmarks010 = exists(sideReceipts.perHandLandmarksPck010) ? readJson(sideReceipts.perHandLandmarksPck010) : {};
  const landmarks005 = exists(sideReceipts.perHandLandmarksPck005) ? readJson(sideReceipts.perHandLandmarksPck005) : {};
  const qualityAudit = exists(sideReceipts.perHandQualityAudit) ? readJson(sideReceipts.perHandQualityAudit) : {};
  const landmarkHeatmap010 = exists(sideReceipts.landmarkHeatmapBestPck010)
    ? readJson(sideReceipts.landmarkHeatmapBestPck010)
    : {};
  const landmarkHeatmap005 = exists(sideReceipts.landmarkHeatmapBestPck005)
    ? readJson(sideReceipts.landmarkHeatmapBestPck005)
    : {};
  const sourcePreservedCropQualityAudit = exists(sideReceipts.sourcePreservedCropQualityAudit)
    ? readJson(sideReceipts.sourcePreservedCropQualityAudit)
    : {};
  const sourcePreservedCropQualityAuditTrain = exists(
    sideReceipts.sourcePreservedCropQualityAuditTrain,
  )
    ? readJson(sideReceipts.sourcePreservedCropQualityAuditTrain)
    : {};
  const sourcePreservedRelabelCandidatesTest = exists(
    sideReceipts.sourcePreservedRelabelCandidatesTest,
  )
    ? readJson(sideReceipts.sourcePreservedRelabelCandidatesTest)
    : {};
  const sourcePreservedRelabelCandidatesTrain = exists(
    sideReceipts.sourcePreservedRelabelCandidatesTrain,
  )
    ? readJson(sideReceipts.sourcePreservedRelabelCandidatesTrain)
    : {};
  const targetedRelabelTrainTop32Rows = exists(sideReceipts.targetedRelabelTrainTop32Rows)
    ? readJson(sideReceipts.targetedRelabelTrainTop32Rows)
    : {};
  const targetedRelabelTestTop32Rows = exists(sideReceipts.targetedRelabelTestTop32Rows)
    ? readJson(sideReceipts.targetedRelabelTestTop32Rows)
    : {};
  const targetedRelabelTrainTop32SelectedOnlyRows = exists(
    sideReceipts.targetedRelabelTrainTop32SelectedOnlyRows,
  )
    ? readJson(sideReceipts.targetedRelabelTrainTop32SelectedOnlyRows)
    : {};
  const targetedRelabelTestTop32SelectedOnlyRows = exists(
    sideReceipts.targetedRelabelTestTop32SelectedOnlyRows,
  )
    ? readJson(sideReceipts.targetedRelabelTestTop32SelectedOnlyRows)
    : {};
  const targetProbe = exists(sideReceipts.pairRankerTargetsTop20) ? readJson(sideReceipts.pairRankerTargetsTop20) : {};
  const targetSelectedProbe = exists(sideReceipts.pairRankerTargetsValSelect)
    ? readJson(sideReceipts.pairRankerTargetsValSelect)
    : {};
  const candidateOracleSweep = exists(sideReceipts.candidateOracleSweep)
    ? readJson(sideReceipts.candidateOracleSweep)
    : {};
  const candidateRepairTargets = exists(sideReceipts.candidateRepairTargets)
    ? readJson(sideReceipts.candidateRepairTargets)
    : {};
  const candidateNoLeakAnalogs = exists(sideReceipts.candidateNoLeakAnalogs)
    ? readJson(sideReceipts.candidateNoLeakAnalogs)
    : {};
  const candidateNoLeakAnalogsT065 = exists(sideReceipts.candidateNoLeakAnalogsT065)
    ? readJson(sideReceipts.candidateNoLeakAnalogsT065)
    : {};
  const proposalTrainAnalogProbe = exists(sideReceipts.proposalTrainAnalogProbe)
    ? readJson(sideReceipts.proposalTrainAnalogProbe)
    : {};
  const proposalTrainAnalogT065Probe = exists(sideReceipts.proposalTrainAnalogT065Probe)
    ? readJson(sideReceipts.proposalTrainAnalogT065Probe)
    : {};
  const subproposalOracle = exists(sideReceipts.subproposalOracle)
    ? readJson(sideReceipts.subproposalOracle)
    : {};
  const subproposalRankerGeom = exists(sideReceipts.subproposalRankerGeom)
    ? readJson(sideReceipts.subproposalRankerGeom)
    : {};
  const subproposalRankerCropPose = exists(sideReceipts.subproposalRankerCropPose)
    ? readJson(sideReceipts.subproposalRankerCropPose)
    : {};
  const candidateHeadCropPose = exists(sideReceipts.candidateHeadCropPose)
    ? readJson(sideReceipts.candidateHeadCropPose)
    : {};
  const candidateSelectionFailureAudit = exists(sideReceipts.candidateSelectionFailureAudit)
    ? readJson(sideReceipts.candidateSelectionFailureAudit)
    : {};
  const candidateHeadPairRankSmoke = exists(sideReceipts.candidateHeadPairRankSmoke)
    ? readJson(sideReceipts.candidateHeadPairRankSmoke)
    : {};
  const candidateHeadPairRankFullBrev = exists(sideReceipts.candidateHeadPairRankFullBrev)
    ? readJson(sideReceipts.candidateHeadPairRankFullBrev)
    : {};
  const candidateHeadPairRankFullBrevFailureAudit = exists(
    sideReceipts.candidateHeadPairRankFullBrevFailureAudit,
  )
    ? readJson(sideReceipts.candidateHeadPairRankFullBrevFailureAudit)
    : {};
  const candidateHeadPairMarginSmoke = exists(sideReceipts.candidateHeadPairMarginSmoke)
    ? readJson(sideReceipts.candidateHeadPairMarginSmoke)
    : {};
  const candidateHeadPairMarginFullBrev = exists(sideReceipts.candidateHeadPairMarginFullBrev)
    ? readJson(sideReceipts.candidateHeadPairMarginFullBrev)
    : {};
  const candidateHeadPairMarginFullBrevFailureAudit = exists(
    sideReceipts.candidateHeadPairMarginFullBrevFailureAudit,
  )
    ? readJson(sideReceipts.candidateHeadPairMarginFullBrevFailureAudit)
    : {};
  const pairRankObjectiveReceipt = exists(pairRankObjectiveReceiptFilePath)
    ? readJson(pairRankObjectiveReceiptFilePath)
    : {};
  const pairMarginSelectorRepairReceipt = exists(pairMarginSelectorRepairReceiptFilePath)
    ? readJson(pairMarginSelectorRepairReceiptFilePath)
    : {};
  const directPairScorerReceipt = exists(directPairScorerReceiptFilePath)
    ? readJson(directPairScorerReceiptFilePath)
    : {};
  const assignmentHeadRepairReceipt = exists(assignmentHeadRepairReceiptFilePath)
    ? readJson(assignmentHeadRepairReceiptFilePath)
    : {};
  const focusedSliverRepairReceipt = exists(focusedSliverRepairReceiptFilePath)
    ? readJson(focusedSliverRepairReceiptFilePath)
    : {};
  const pairRankerCalibrationAuditReceipt = exists(pairRankerCalibrationAuditReceiptFilePath)
    ? readJson(pairRankerCalibrationAuditReceiptFilePath)
    : {};
  const directPairMarginObjectiveReceipt = exists(directPairMarginObjectiveReceiptFilePath)
    ? readJson(directPairMarginObjectiveReceiptFilePath)
    : {};
  const landmarkCacheRebuildEvalReceipt = exists(landmarkCacheRebuildEvalReceiptFilePath)
    ? readJson(landmarkCacheRebuildEvalReceiptFilePath)
    : {};
  const landmarkRetrainBrevPlanReceipt = exists(landmarkRetrainBrevPlanReceiptFilePath)
    ? readJson(landmarkRetrainBrevPlanReceiptFilePath)
    : {};
  const landmarkRetrainBrevRunReceipt = exists(landmarkRetrainBrevRunReceiptFilePath)
    ? readJson(landmarkRetrainBrevRunReceiptFilePath)
    : {};
  const landmarkRetrainRegressionPivotReceipt = exists(
    landmarkRetrainRegressionPivotReceiptFilePath,
  )
    ? readJson(landmarkRetrainRegressionPivotReceiptFilePath)
    : {};
  const landmarkPckCampaignResearchPlanReceipt = exists(
    landmarkPckCampaignResearchPlanReceiptFilePath,
  )
    ? readJson(landmarkPckCampaignResearchPlanReceiptFilePath)
    : {};
  const landmarkPckCampaignRun1Receipt = exists(landmarkPckCampaignRun1ReceiptFilePath)
    ? readJson(landmarkPckCampaignRun1ReceiptFilePath)
    : {};
  const landmarkPckCampaignRun2Receipt = exists(landmarkPckCampaignRun2ReceiptFilePath)
    ? readJson(landmarkPckCampaignRun2ReceiptFilePath)
    : {};
  const landmarkPckCampaignRun3Receipt = exists(landmarkPckCampaignRun3ReceiptFilePath)
    ? readJson(landmarkPckCampaignRun3ReceiptFilePath)
    : {};
  const landmarkPckResearchRefreshAfterRun3Receipt = exists(
    landmarkPckResearchRefreshAfterRun3ReceiptFilePath,
  )
    ? readJson(landmarkPckResearchRefreshAfterRun3ReceiptFilePath)
    : {};
  const landmarkPckResunetArchitecturePreflightReceipt = exists(
    landmarkPckResunetArchitecturePreflightReceiptFilePath,
  )
    ? readJson(landmarkPckResunetArchitecturePreflightReceiptFilePath)
    : {};
  const recognizerSchedulerPreflightReceipt = exists(
    recognizerSchedulerPreflightReceiptFilePath,
  )
    ? readJson(recognizerSchedulerPreflightReceiptFilePath)
    : {};
  const recognizerRun3SchedulerFulltrainReceipt = exists(
    recognizerRun3SchedulerFulltrainReceiptFilePath,
  )
    ? readJson(recognizerRun3SchedulerFulltrainReceiptFilePath)
    : {};
  const recognizerRun3ResearchTuningReceipt = exists(
    recognizerRun3ResearchTuningReceiptFilePath,
  )
    ? readJson(recognizerRun3ResearchTuningReceiptFilePath)
    : {};
  const recognizerT32CacheLoaderPreflightReceipt = exists(
    recognizerT32CacheLoaderPreflightReceiptFilePath,
  )
    ? readJson(recognizerT32CacheLoaderPreflightReceiptFilePath)
    : {};
  const recognizerT32CacheSmokeValidateReceipt = exists(
    recognizerT32CacheSmokeValidateReceiptFilePath,
  )
    ? readJson(recognizerT32CacheSmokeValidateReceiptFilePath)
    : {};
  const recognizerT32FullCacheValidateReceipt = exists(
    recognizerT32FullCacheValidateReceiptFilePath,
  )
    ? readJson(recognizerT32FullCacheValidateReceiptFilePath)
    : {};
  const recognizerRun4T32PreflightBlockerReceipt = exists(
    recognizerRun4T32PreflightBlockerReceiptFilePath,
  )
    ? readJson(recognizerRun4T32PreflightBlockerReceiptFilePath)
    : {};
  const recognizerRun4T32HealthRefreshReceipt = exists(
    recognizerRun4T32HealthRefreshReceiptFilePath,
  )
    ? readJson(recognizerRun4T32HealthRefreshReceiptFilePath)
    : {};
  const recognizerRun4T32FulltrainReceipt = exists(
    recognizerRun4T32FulltrainReceiptFilePath,
  )
    ? readJson(recognizerRun4T32FulltrainReceiptFilePath)
    : {};
  const recognizerRun4ResearchTuningReceipt = exists(
    recognizerRun4ResearchTuningReceiptFilePath,
  )
    ? readJson(recognizerRun4ResearchTuningReceiptFilePath)
    : {};
  const recognizerRun5SupconPreflightReceipt = exists(
    recognizerRun5SupconPreflightReceiptFilePath,
  )
    ? readJson(recognizerRun5SupconPreflightReceiptFilePath)
    : {};
  const recognizerRun5SupconFulltrainReceipt = exists(
    recognizerRun5SupconFulltrainReceiptFilePath,
  )
    ? readJson(recognizerRun5SupconFulltrainReceiptFilePath)
    : {};
  const recognizerRun5ResearchTuningReceipt = exists(
    recognizerRun5ResearchTuningReceiptFilePath,
  )
    ? readJson(recognizerRun5ResearchTuningReceiptFilePath)
    : {};
  const recognizerRun6VerificationMarginPreflightReceipt = exists(
    recognizerRun6VerificationMarginPreflightReceiptFilePath,
  )
    ? readJson(recognizerRun6VerificationMarginPreflightReceiptFilePath)
    : {};
  const recognizerRun6T32PreflightBlockerReceipt = exists(
    recognizerRun6T32PreflightBlockerReceiptFilePath,
  )
    ? readJson(recognizerRun6T32PreflightBlockerReceiptFilePath)
    : {};
  const recognizerRun6VerifselectFulltrainReceipt = exists(
    recognizerRun6VerifselectFulltrainReceiptFilePath,
  )
    ? readJson(recognizerRun6VerifselectFulltrainReceiptFilePath)
    : {};
  const recognizerRun6ResearchTuningReceipt = exists(
    recognizerRun6ResearchTuningReceiptFilePath,
  )
    ? readJson(recognizerRun6ResearchTuningReceiptFilePath)
    : {};
  const recognizerRun7VerificationTailAuditReceipt = exists(
    recognizerRun7VerificationTailAuditReceiptFilePath,
  )
    ? readJson(recognizerRun7VerificationTailAuditReceiptFilePath)
    : {};
  const recognizerRun7HardNegativeObjectiveResearchReceipt = exists(
    recognizerRun7HardNegativeObjectiveResearchReceiptFilePath,
  )
    ? readJson(recognizerRun7HardNegativeObjectiveResearchReceiptFilePath)
    : {};
  const recognizerRun7OvrBceHardnegPreflightReceipt = exists(
    recognizerRun7OvrBceHardnegPreflightReceiptFilePath,
  )
    ? readJson(recognizerRun7OvrBceHardnegPreflightReceiptFilePath)
    : {};
  const recognizerRun7OvrBceHardnegFulltrainReceipt = exists(
    recognizerRun7OvrBceHardnegFulltrainReceiptFilePath,
  )
    ? readJson(recognizerRun7OvrBceHardnegFulltrainReceiptFilePath)
    : {};
  const recognizerRun7OvrBceResearchTuningReceipt = exists(
    recognizerRun7OvrBceResearchTuningReceiptFilePath,
  )
    ? readJson(recognizerRun7OvrBceResearchTuningReceiptFilePath)
    : {};
  const recognizerRun6VsRun7CalibrationAuditReceipt = exists(
    recognizerRun6VsRun7CalibrationAuditReceiptFilePath,
  )
    ? readJson(recognizerRun6VsRun7CalibrationAuditReceiptFilePath)
    : {};
  const recognizerRun7TestRecallReproductionDiscrepancyReceipt = exists(
    recognizerRun7TestRecallReproductionDiscrepancyReceiptFilePath,
  )
    ? readJson(recognizerRun7TestRecallReproductionDiscrepancyReceiptFilePath)
    : {};
  const recognizerRun8OvrBceW001PreflightReceipt = exists(
    recognizerRun8OvrBceW001PreflightReceiptFilePath,
  )
    ? readJson(recognizerRun8OvrBceW001PreflightReceiptFilePath)
    : {};
  const recognizerRun8OvrBceW001PreflightBlockerReceipt = exists(
    recognizerRun8OvrBceW001PreflightBlockerReceiptFilePath,
  )
    ? readJson(recognizerRun8OvrBceW001PreflightBlockerReceiptFilePath)
    : {};
  const recognizerRun8OvrBceW001FulltrainReceipt = exists(
    recognizerRun8OvrBceW001FulltrainReceiptFilePath,
  )
    ? readJson(recognizerRun8OvrBceW001FulltrainReceiptFilePath)
    : {};
  const recognizerRun8OvrBceW001ResearchTuningReceipt = exists(
    recognizerRun8OvrBceW001ResearchTuningReceiptFilePath,
  )
    ? readJson(recognizerRun8OvrBceW001ResearchTuningReceiptFilePath)
    : {};
  const recognizerRun6Run7Run8CalibrationTailAuditReceipt = exists(
    recognizerRun6Run7Run8CalibrationTailAuditReceiptFilePath,
  )
    ? readJson(recognizerRun6Run7Run8CalibrationTailAuditReceiptFilePath)
    : {};
  const recognizerPostOvrBceCalibrationSafeResearchReceipt = exists(
    recognizerPostOvrBceCalibrationSafeResearchReceiptFilePath,
  )
    ? readJson(recognizerPostOvrBceCalibrationSafeResearchReceiptFilePath)
    : {};
  const recognizerRun6MonitorSelectionStabilityPreflightReceipt = exists(
    recognizerRun6MonitorSelectionStabilityPreflightReceiptFilePath,
  )
    ? readJson(recognizerRun6MonitorSelectionStabilityPreflightReceiptFilePath)
    : {};
  const recognizerCandidateCheckpointRetentionPreflightReceipt = exists(
    recognizerCandidateCheckpointRetentionPreflightReceiptFilePath,
  )
    ? readJson(recognizerCandidateCheckpointRetentionPreflightReceiptFilePath)
    : {};
  const recognizerRetentionEnabledResearchTuningReceipt = exists(
    recognizerRetentionEnabledResearchTuningReceiptFilePath,
  )
    ? readJson(recognizerRetentionEnabledResearchTuningReceiptFilePath)
    : {};
  const recognizerRun9RetentionEnabledRun6RecipePreflightReceipt = exists(
    recognizerRun9RetentionEnabledRun6RecipePreflightReceiptFilePath,
  )
    ? readJson(recognizerRun9RetentionEnabledRun6RecipePreflightReceiptFilePath)
    : {};
  const recognizerRun9BrevAuthVisibilityRefreshReceipt = exists(
    recognizerRun9BrevAuthVisibilityRefreshReceiptFilePath,
  )
    ? readJson(recognizerRun9BrevAuthVisibilityRefreshReceiptFilePath)
    : {};
  const recognizerRun9BrevAuthVisibilityRetryReceipt = exists(
    recognizerRun9BrevAuthVisibilityRetryReceiptFilePath,
  )
    ? readJson(recognizerRun9BrevAuthVisibilityRetryReceiptFilePath)
    : {};
  const recognizerRun9BrevAuthHumanLoginBoundaryReceipt = exists(
    recognizerRun9BrevAuthHumanLoginBoundaryReceiptFilePath,
  )
    ? readJson(recognizerRun9BrevAuthHumanLoginBoundaryReceiptFilePath)
    : {};
  const recognizerRun6VsRun7CalibrationDetailedReceipt = exists(
    recognizerRun6VsRun7CalibrationDetailedReceiptFilePath,
  )
    ? readJson(recognizerRun6VsRun7CalibrationDetailedReceiptFilePath)
    : {};
  const recognizerRun6Run7Run8CalibrationTailDetailedReceipt = exists(
    recognizerRun6Run7Run8CalibrationTailDetailedReceiptFilePath,
  )
    ? readJson(recognizerRun6Run7Run8CalibrationTailDetailedReceiptFilePath)
    : {};
  const recognizerRun6MonitorSelectionStabilityDetailedReceipt = exists(
    recognizerRun6MonitorSelectionStabilityDetailedReceiptFilePath,
  )
    ? readJson(recognizerRun6MonitorSelectionStabilityDetailedReceiptFilePath)
    : {};
  const recognizerCandidateCheckpointRetentionDryrunReceipt = exists(
    recognizerCandidateCheckpointRetentionDryrunReceiptFilePath,
  )
    ? readJson(recognizerCandidateCheckpointRetentionDryrunReceiptFilePath)
    : {};
  const recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt = exists(
    recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptFilePath,
  )
    ? readJson(recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptFilePath)
    : {};
  const recognizerRun7OvrBceHardnegDryrunArtifactFilePath = path.join(
    sideToolRoot,
    "output/m3jb-recognizer-transformer-run7-ovr-bce-hardneg-pretrain-dryrun-brev-v1.json",
  );
  const recognizerRun7OvrBceHardnegFulltrainJsonArtifactFilePath = path.join(
    sideToolRoot,
    "output/m3jb-recognizer-transformer-run7-ovr-bce-hardneg-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-ovrbce003-brev-v1.json",
  );
  const recognizerRun7OvrBceHardnegFulltrainPtArtifactFilePath = path.join(
    sideToolRoot,
    "output/m3jb-recognizer-transformer-run7-ovr-bce-hardneg-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-ovrbce003-brev-v1.pt",
  );
  const recognizerRun7OvrBceHardnegFulltrainLogArtifactFilePath = path.join(
    sideToolRoot,
    "output/m3jb-recognizer-transformer-run7-ovr-bce-hardneg-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-ovrbce003-brev-v1.log",
  );
  const recognizerSchedulerTinyOverfitReceipt = exists(
    recognizerSchedulerTinyOverfitReceiptFilePath,
  )
    ? readJson(recognizerSchedulerTinyOverfitReceiptFilePath)
    : {};
  const recognizerSchedulerFullDataSmokeReceipt = exists(
    recognizerSchedulerFullDataSmokeReceiptFilePath,
  )
    ? readJson(recognizerSchedulerFullDataSmokeReceiptFilePath)
    : {};
  const recognizerT32LoaderDryrunReceipt = exists(
    recognizerT32LoaderDryrunReceiptFilePath,
  )
    ? readJson(recognizerT32LoaderDryrunReceiptFilePath)
    : {};
  const recognizerT32CacheSmokeDryrunReceipt = exists(
    recognizerT32CacheSmokeDryrunReceiptFilePath,
  )
    ? readJson(recognizerT32CacheSmokeDryrunReceiptFilePath)
    : {};
  const recognizerT32FullCacheDryrunReceipt = exists(
    recognizerT32FullCacheDryrunReceiptFilePath,
  )
    ? readJson(recognizerT32FullCacheDryrunReceiptFilePath)
    : {};
  const recognizerRun5SupconZeroWeightDryrunReceipt = exists(
    recognizerRun5SupconZeroWeightDryrunReceiptFilePath,
  )
    ? readJson(recognizerRun5SupconZeroWeightDryrunReceiptFilePath)
    : {};
  const recognizerRun5SupconWeight005DryrunReceipt = exists(
    recognizerRun5SupconWeight005DryrunReceiptFilePath,
  )
    ? readJson(recognizerRun5SupconWeight005DryrunReceiptFilePath)
    : {};
  const recognizerRun6VerificationMarginDiagnosticReceipt = exists(
    recognizerRun6VerificationMarginDiagnosticReceiptFilePath,
  )
    ? readJson(recognizerRun6VerificationMarginDiagnosticReceiptFilePath)
    : {};
  const recognizerRun6VerifselectDryrunReceipt = exists(
    recognizerRun6VerifselectDryrunReceiptFilePath,
  )
    ? readJson(recognizerRun6VerifselectDryrunReceiptFilePath)
    : {};
  const recognizerRun7VerificationTailDiagnosticReceipt = exists(
    recognizerRun7VerificationTailDiagnosticReceiptFilePath,
  )
    ? readJson(recognizerRun7VerificationTailDiagnosticReceiptFilePath)
    : {};
  const recognizerRun7OvrBceHardnegZeroWeightDryrunReceipt = exists(
    recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptFilePath,
  )
    ? readJson(recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptFilePath)
    : {};
  const recognizerRun7OvrBceHardnegWeight003DryrunReceipt = exists(
    recognizerRun7OvrBceHardnegWeight003DryrunReceiptFilePath,
  )
    ? readJson(recognizerRun7OvrBceHardnegWeight003DryrunReceiptFilePath)
    : {};
  const recognizerRun8OvrBceW001DryrunReceipt = exists(
    recognizerRun8OvrBceW001DryrunReceiptFilePath,
  )
    ? readJson(recognizerRun8OvrBceW001DryrunReceiptFilePath)
    : {};
  const landmarkRetrainLocalPreflightReceipt = exists(landmarkRetrainLocalPreflightReceiptFilePath)
    ? readJson(landmarkRetrainLocalPreflightReceiptFilePath)
    : {};
  const brevReadinessRefreshReceipt = exists(brevReadinessRefreshReceiptFilePath)
    ? readJson(brevReadinessRefreshReceiptFilePath)
    : {};
  const brevApprovalRequestReceipt = exists(brevApprovalRequestReceiptFilePath)
    ? readJson(brevApprovalRequestReceiptFilePath)
    : {};
  const brevApprovalBlockerReceipt = exists(brevApprovalBlockerReceiptFilePath)
    ? readJson(brevApprovalBlockerReceiptFilePath)
    : {};
  const codexSupervisorDryRunReceipt = exists(codexSupervisorDryRunReceiptFilePath)
    ? readJson(codexSupervisorDryRunReceiptFilePath)
    : {};
  const codexBothDryRunReceipt = exists(codexBothDryRunReceiptFilePath)
    ? readJson(codexBothDryRunReceiptFilePath)
    : {};
  const focusedSliverOracleAug64 = exists(sideReceipts.focusedSliverSubproposalOracleAug64)
    ? readJson(sideReceipts.focusedSliverSubproposalOracleAug64)
    : {};
  const directPairScorerSmoke = exists(sideReceipts.directPairScorerSmoke)
    ? readJson(sideReceipts.directPairScorerSmoke)
    : {};
  const directPairScorerFullBrev = exists(sideReceipts.directPairScorerFullBrev)
    ? readJson(sideReceipts.directPairScorerFullBrev)
    : {};
  const assignmentHeadFullBrev = exists(sideReceipts.assignmentHeadFullBrev)
    ? readJson(sideReceipts.assignmentHeadFullBrev)
    : {};
  const assignmentHeadLossOnlyFullBrev = exists(sideReceipts.assignmentHeadLossOnlyFullBrev)
    ? readJson(sideReceipts.assignmentHeadLossOnlyFullBrev)
    : {};
  const focusedSliverDirectPairFullBrev = exists(sideReceipts.focusedSliverDirectPairFullBrev)
    ? readJson(sideReceipts.focusedSliverDirectPairFullBrev)
    : {};
  const focusedSliverDirectPairCalibrationAudit = exists(
    sideReceipts.focusedSliverDirectPairCalibrationAudit,
  )
    ? readJson(sideReceipts.focusedSliverDirectPairCalibrationAudit)
    : {};
  const directPairMarginSmoke = exists(sideReceipts.directPairMarginSmoke)
    ? readJson(sideReceipts.directPairMarginSmoke)
    : {};
  const landmarkPckCampaignRun1 = exists(sideReceipts.landmarkPckCampaignRun1)
    ? readJson(sideReceipts.landmarkPckCampaignRun1)
    : {};
  const landmarkPckCampaignRun1EvalPck010 = exists(
    sideReceipts.landmarkPckCampaignRun1EvalPck010,
  )
    ? readJson(sideReceipts.landmarkPckCampaignRun1EvalPck010)
    : {};
  const landmarkPckCampaignRun1EvalPck005 = exists(
    sideReceipts.landmarkPckCampaignRun1EvalPck005,
  )
    ? readJson(sideReceipts.landmarkPckCampaignRun1EvalPck005)
    : {};
  const landmarkPckCampaignRun2 = exists(sideReceipts.landmarkPckCampaignRun2)
    ? readJson(sideReceipts.landmarkPckCampaignRun2)
    : {};
  const landmarkPckCampaignRun2EvalPck010 = exists(
    sideReceipts.landmarkPckCampaignRun2EvalPck010,
  )
    ? readJson(sideReceipts.landmarkPckCampaignRun2EvalPck010)
    : {};
  const landmarkPckCampaignRun2EvalPck005 = exists(
    sideReceipts.landmarkPckCampaignRun2EvalPck005,
  )
    ? readJson(sideReceipts.landmarkPckCampaignRun2EvalPck005)
    : {};
  const landmarkPckCampaignRun3 = exists(sideReceipts.landmarkPckCampaignRun3)
    ? readJson(sideReceipts.landmarkPckCampaignRun3)
    : {};
  const landmarkPckCampaignRun3EvalPck010 = exists(
    sideReceipts.landmarkPckCampaignRun3EvalPck010,
  )
    ? readJson(sideReceipts.landmarkPckCampaignRun3EvalPck010)
    : {};
  const landmarkPckCampaignRun3EvalPck005 = exists(
    sideReceipts.landmarkPckCampaignRun3EvalPck005,
  )
    ? readJson(sideReceipts.landmarkPckCampaignRun3EvalPck005)
    : {};
  const focusLabels = exists(focusLabelsPath) ? readJson(focusLabelsPath) : null;
  const focusDebug = exists(focusDebugSummaryPath) ? readJson(focusDebugSummaryPath) : null;
  const browserRequirementEvidence = browserProductRequirementEvidence(webPreviewEvidence);

  const detectorOld = detector.real_twohand_eval?.old ?? {};
  const detectorNew = detector.real_twohand_eval?.new ?? {};
  const rankerSelected = ranker.real_twohand?.selected ?? {};
  const rankerOracle = ranker.real_twohand?.oracle ?? {};
  const targetValSelected = targetSelectedProbe.real_twohand?.selected ?? {};
  const targetValOracle = targetSelectedProbe.real_twohand?.oracle ?? {};
  const currentPairSelected = targetSelectedProbe.schema_version ? targetValSelected : rankerSelected;
  const currentPairOracle = targetSelectedProbe.schema_version ? targetValOracle : rankerOracle;
  const deterministicPostfilterCeiling = deterministicPostfilterCeilingMetrics(
    candidateSelectionFailureAudit,
    sideReceipts.candidateSelectionFailureAudit,
  );

  addCheck(
    checks,
    blockers,
    "candidate_failure_audit_supports_deterministic_postfilter_ceiling",
    deterministicPostfilterCeiling?.postfilter_ceiling?.distinct_assigned_coverage === 0.97619
      && deterministicPostfilterCeiling?.postfilter_ceiling?.coverage === 0.988095
      && deterministicPostfilterCeiling?.union?.named_filter_flagged_rows === 51,
    {
      path: rel(sideReceipts.candidateSelectionFailureAudit),
      expected_named_filter_flagged_rows: 51,
      expected_named_filter_ceiling_distinct_assigned_coverage: 0.97619,
      expected_named_filter_ceiling_coverage: 0.988095,
      observed: deterministicPostfilterCeiling?.postfilter_ceiling ?? null,
      observed_named_filter_flagged_rows:
        deterministicPostfilterCeiling?.union?.named_filter_flagged_rows ?? null,
    },
    "candidate-selection failure audit must support the deterministic post-filter ceiling measurement",
  );
  addCheck(
    checks,
    blockers,
    "browser_product_gate_requirement_answered",
    browserRequirementEvidence?.product_gate_answer?.current_repo_requirement_proven === true
      && browserRequirementEvidence?.product_gate_answer
        ?.distinct_lr_assignment_required_by_current_active_recognizer === false
      && browserRequirementEvidence?.current_practice_pass_fail_path
        ?.consumes_detector0_or_hand_slots === false
      && browserRequirementEvidence?.live_tracking_preview_path?.uses_anatomical_lr_slot_names === false,
    {
      current_repo_requirement_proven:
        browserRequirementEvidence?.product_gate_answer?.current_repo_requirement_proven ?? null,
      distinct_lr_assignment_required_by_current_active_recognizer:
        browserRequirementEvidence?.product_gate_answer
          ?.distinct_lr_assignment_required_by_current_active_recognizer ?? null,
      practice_consumes_detector0_or_hand_slots:
        browserRequirementEvidence?.current_practice_pass_fail_path
          ?.consumes_detector0_or_hand_slots ?? null,
      live_tracker_uses_anatomical_lr_slot_names:
        browserRequirementEvidence?.live_tracking_preview_path?.uses_anatomical_lr_slot_names ?? null,
      files: browserRequirementEvidence?.files ?? null,
    },
    "current browser product-gate evidence must answer whether distinct L/R assignment is required",
  );

  const proposalMetrics = {
    old_receipt_style_coverage: round(detectorOld.coverage),
    old_distinct_assigned_coverage: round(detectorOld.distinct_assigned_coverage),
    old_collapse_rate: round(detectorOld.collapse_rate),
    selected_detector_receipt_style_coverage: round(detectorNew.coverage),
    selected_detector_distinct_assigned_coverage: round(detectorNew.distinct_assigned_coverage),
    selected_detector_collapse_rate: round(detectorNew.collapse_rate),
    heuristic_top2nms_coverage: round(detectorNew.coverage),
    heuristic_top2nms_distinct_assigned_coverage: round(detectorNew.distinct_assigned_coverage),
    heuristic_top2nms_collapse_rate: round(detectorNew.collapse_rate),
    heuristic_top2nms_decoded_two_distinct: round(detectorNew.decoded_two_distinct),
    heuristic_top2nms_same_prediction_coverage_count:
      detectorNew.same_prediction_coverage_count ?? null,
    heuristic_top2nms_coverage_failure_count: detectorNew.coverage_failure_count ?? null,
    heuristic_top2nms_distinct_assignment_failure_count:
      detectorNew.distinct_assignment_failure_count ?? null,
    deterministic_postfilter_named_ceiling_coverage:
      deterministicPostfilterCeiling?.postfilter_ceiling?.coverage ?? null,
    deterministic_postfilter_named_ceiling_distinct_assigned_coverage:
      deterministicPostfilterCeiling?.postfilter_ceiling?.distinct_assigned_coverage ?? null,
    deterministic_postfilter_named_ceiling_distinct_pass_rows:
      deterministicPostfilterCeiling?.postfilter_ceiling?.distinct_pass_rows ?? null,
    deterministic_postfilter_named_ceiling_unrecovered_distinct_failures:
      deterministicPostfilterCeiling?.postfilter_ceiling?.unrecovered_distinct_failure_rows ?? null,
    crop_pose_ranker_coverage: round(rankerSelected.coverage),
    crop_pose_ranker_distinct_assigned_coverage: round(rankerSelected.distinct_assigned_coverage),
    crop_pose_ranker_collapse_rate: round(rankerSelected.collapse_rate),
    validation_selected_target_ranker_coverage: round(targetValSelected.coverage),
    validation_selected_target_ranker_distinct_assigned_coverage: round(targetValSelected.distinct_assigned_coverage),
    validation_selected_target_ranker_collapse_rate: round(targetValSelected.collapse_rate),
    wider_candidate_oracle_topk: candidateOracleSweep.best?.topk ?? null,
    wider_candidate_oracle_nms_iou: round(candidateOracleSweep.best?.nms_iou),
    wider_candidate_oracle_coverage: round(candidateOracleSweep.best?.metrics?.coverage),
    wider_candidate_oracle_distinct_assigned_coverage: round(
      candidateOracleSweep.best?.metrics?.distinct_assigned_coverage,
    ),
    wider_candidate_oracle_collapse_rate: round(candidateOracleSweep.best?.metrics?.collapse_rate),
    current_pair_ranker_coverage: round(currentPairSelected.coverage),
    current_pair_ranker_distinct_assigned_coverage: round(currentPairSelected.distinct_assigned_coverage),
    current_pair_ranker_collapse_rate: round(currentPairSelected.collapse_rate),
    pairrank_full_brev_real_twohand_coverage: round(
      candidateHeadPairRankFullBrev.real_twohand?.selected?.coverage,
    ),
    pairrank_full_brev_real_twohand_distinct_assigned_coverage: round(
      candidateHeadPairRankFullBrev.real_twohand?.selected?.distinct_assigned_coverage,
    ),
    pairrank_full_brev_real_twohand_collapse_rate: round(
      candidateHeadPairRankFullBrev.real_twohand?.selected?.collapse_rate,
    ),
    pairrank_full_brev_real_twohand_oracle_distinct_assigned_coverage: round(
      candidateHeadPairRankFullBrev.real_twohand?.oracle?.distinct_assigned_coverage,
    ),
    pairmargin_full_brev_real_twohand_coverage: round(
      candidateHeadPairMarginFullBrev.real_twohand?.selected?.coverage,
    ),
    pairmargin_full_brev_real_twohand_distinct_assigned_coverage: round(
      candidateHeadPairMarginFullBrev.real_twohand?.selected?.distinct_assigned_coverage,
    ),
    pairmargin_full_brev_real_twohand_collapse_rate: round(
      candidateHeadPairMarginFullBrev.real_twohand?.selected?.collapse_rate,
    ),
    pairmargin_full_brev_real_twohand_oracle_distinct_assigned_coverage: round(
      candidateHeadPairMarginFullBrev.real_twohand?.oracle?.distinct_assigned_coverage,
    ),
    directpair_full_brev_real_twohand_coverage: round(
      directPairScorerFullBrev.real_twohand?.selected?.coverage,
    ),
    directpair_full_brev_real_twohand_distinct_assigned_coverage: round(
      directPairScorerFullBrev.real_twohand?.selected?.distinct_assigned_coverage,
    ),
    directpair_full_brev_real_twohand_collapse_rate: round(
      directPairScorerFullBrev.real_twohand?.selected?.collapse_rate,
    ),
    assignmenthead_score_full_brev_real_twohand_coverage: round(
      assignmentHeadFullBrev.real_twohand?.selected?.coverage,
    ),
    assignmenthead_score_full_brev_real_twohand_distinct_assigned_coverage: round(
      assignmentHeadFullBrev.real_twohand?.selected?.distinct_assigned_coverage,
    ),
    assignmenthead_score_full_brev_real_twohand_collapse_rate: round(
      assignmentHeadFullBrev.real_twohand?.selected?.collapse_rate,
    ),
    assignmenthead_lossonly_full_brev_real_twohand_coverage: round(
      assignmentHeadLossOnlyFullBrev.real_twohand?.selected?.coverage,
    ),
    assignmenthead_lossonly_full_brev_real_twohand_distinct_assigned_coverage: round(
      assignmentHeadLossOnlyFullBrev.real_twohand?.selected?.distinct_assigned_coverage,
    ),
    assignmenthead_lossonly_full_brev_real_twohand_collapse_rate: round(
      assignmentHeadLossOnlyFullBrev.real_twohand?.selected?.collapse_rate,
    ),
    focusedsliver_oracle_aug64_real_twohand_coverage: round(
      focusedSliverOracleAug64.subproposal_oracle_metrics?.coverage,
    ),
    focusedsliver_oracle_aug64_real_twohand_distinct_assigned_coverage: round(
      focusedSliverOracleAug64.subproposal_oracle_metrics?.distinct_assigned_coverage,
    ),
    focusedsliver_oracle_aug64_real_twohand_collapse_rate: round(
      focusedSliverOracleAug64.subproposal_oracle_metrics?.collapse_rate,
    ),
    focusedsliver_directpair_aug64_full_brev_real_twohand_coverage: round(
      focusedSliverDirectPairFullBrev.real_twohand?.selected?.coverage,
    ),
    focusedsliver_directpair_aug64_full_brev_real_twohand_distinct_assigned_coverage: round(
      focusedSliverDirectPairFullBrev.real_twohand?.selected?.distinct_assigned_coverage,
    ),
    focusedsliver_directpair_aug64_full_brev_real_twohand_collapse_rate: round(
      focusedSliverDirectPairFullBrev.real_twohand?.selected?.collapse_rate,
    ),
    focusedsliver_directpair_aug64_full_brev_real_twohand_oracle_distinct_assigned_coverage:
      round(focusedSliverDirectPairFullBrev.real_twohand?.oracle?.distinct_assigned_coverage),
    top20_oracle_coverage: round(currentPairOracle.coverage),
    top20_oracle_distinct_assigned_coverage: round(currentPairOracle.distinct_assigned_coverage),
    top20_oracle_collapse_rate: round(currentPairOracle.collapse_rate),
    n_real_twohand: detector.real_twohand_eval?.n_real_twohand ?? rankerSelected.n ?? null,
    coverage_iou: detector.real_twohand_eval?.coverage_iou ?? currentPairSelected.coverage_iou ?? null,
  };

  const heuristicTop2NmsBaseline = detector.schema_version
    ? top2NmsBaselineMetrics(detector, sideReceipts.detectorDistinct)
    : null;
  const top2NmsTwoNonCollapsedBoxesPass =
    gateResult(heuristicTop2NmsBaseline?.decoded_two_distinct, ">=", 0.98)
    && gateResult(heuristicTop2NmsBaseline?.collapse_rate, "<=", 0.02);
  const top2NmsDistinctAssignmentPass = gateResult(
    heuristicTop2NmsBaseline?.distinct_assigned_coverage,
    ">=",
    0.98,
  );
  const productGateQuestion = heuristicTop2NmsBaseline
    ? {
        question:
          "Does the recognizer actually require stable distinct L/R assignment >= 0.98, or are two non-collapsed hand boxes enough?",
        evidence_scope:
          "84 real two-hand rows, owned detector top-2 objectness + NMS decode, deterministic post-filter ceiling, and current browser code in the sibling asl-pilot-web checkout",
        distinct_lr_assignment_gate: {
          required_if_hard_gate: 0.98,
          measured_top2nms: heuristicTop2NmsBaseline.distinct_assigned_coverage,
          measured_named_postfilter_ceiling:
            deterministicPostfilterCeiling?.postfilter_ceiling?.distinct_assigned_coverage ?? null,
          status: deterministicPostfilterCeiling?.postfilter_ceiling?.distinct_gate_pass
            ? "passed_under_named_postfilter_ceiling"
            : top2NmsDistinctAssignmentPass
              ? "passed_under_top2nms_baseline"
              : "failed_under_current_metric",
        },
        two_non_collapsed_boxes_proxy: {
          decoded_two_distinct: heuristicTop2NmsBaseline.decoded_two_distinct,
          collapse_rate: heuristicTop2NmsBaseline.collapse_rate,
          status: top2NmsTwoNonCollapsedBoxesPass
            ? "passes_two_non_collapsed_box_proxy"
            : "fails_two_non_collapsed_box_proxy",
        },
        deterministic_postfilter_coverage_proxy: deterministicPostfilterCeiling
          ? {
              coverage: deterministicPostfilterCeiling.postfilter_ceiling.coverage,
              coverage_pass_rows: deterministicPostfilterCeiling.postfilter_ceiling.coverage_pass_rows,
              status: deterministicPostfilterCeiling.postfilter_ceiling.coverage_gate_pass
                ? "passes_0p98_coverage_proxy"
                : "below_0p98_coverage_proxy",
            }
          : null,
        both_hands_matched_proxy: {
          coverage: heuristicTop2NmsBaseline.coverage,
          coverage_iou: heuristicTop2NmsBaseline.coverage_iou,
          status: gateResult(heuristicTop2NmsBaseline.coverage, ">=", 0.98)
            ? "passes_0p98_coverage_proxy"
            : "below_0p98_coverage_proxy",
        },
        current_browser_requirement:
          browserRequirementEvidence?.product_gate_answer ?? null,
        current_repo_requirement_proven:
          browserRequirementEvidence?.product_gate_answer?.current_repo_requirement_proven ?? false,
        human_gate_reframe_flag:
          (browserRequirementEvidence?.product_gate_answer?.human_gate_reframe_flag ?? false)
          || (top2NmsTwoNonCollapsedBoxesPass && !top2NmsDistinctAssignmentPass),
        interpretation:
          "Current browser pass/fail recognition is raw-frame/model-card based and fail-closed; it does not consume Detector0 hand slots or anatomical L/R assignment. The live tracker path is preview-only and emits anonymous hand_0/hand_1 display tracks after duplicate suppression, not anatomical left/right. For the current product code, distinct L/R assignment >= 0.98 is therefore not a current recognizer requirement; keep the 0.98 assignment gate as a future tracker/slot contract unless a promoted consumer explicitly requires it.",
      }
    : null;
  const currentProductBoxProxyPass =
    top2NmsTwoNonCollapsedBoxesPass
    && browserRequirementEvidence?.product_gate_answer
      ?.distinct_lr_assignment_required_by_current_active_recognizer === false
    && browserRequirementEvidence?.current_practice_pass_fail_path
      ?.consumes_detector0_or_hand_slots === false;
  const futureSlotDistinctAssignmentPass =
    deterministicPostfilterCeiling?.postfilter_ceiling?.distinct_gate_pass === true
    || top2NmsDistinctAssignmentPass;
  const currentVsFutureBoxGateSplit = heuristicTop2NmsBaseline
    ? {
        evidence_scope:
          "Current browser pass/fail code, live tracking preview code, top-2 objectness + NMS heuristic baseline, and named deterministic post-filter ceiling.",
        current_product_box_proxy: {
          status: currentProductBoxProxyPass
            ? "passed_current_product_proxy"
            : "not_proven_current_product_proxy",
          recognized_consumer:
            "current active practice pass/fail recognizer",
          recognizer_consumes_detector0_or_hand_slots:
            browserRequirementEvidence?.current_practice_pass_fail_path
              ?.consumes_detector0_or_hand_slots ?? null,
          distinct_lr_assignment_required_by_current_recognizer:
            browserRequirementEvidence?.product_gate_answer
              ?.distinct_lr_assignment_required_by_current_active_recognizer ?? null,
          two_non_collapsed_box_metrics: {
            decoded_two_distinct: heuristicTop2NmsBaseline.decoded_two_distinct,
            duplicate_collapse: heuristicTop2NmsBaseline.collapse_rate,
          },
          deterministic_filter_coverage_proxy: deterministicPostfilterCeiling
            ? {
                coverage: deterministicPostfilterCeiling.postfilter_ceiling.coverage,
                coverage_pass_rows:
                  deterministicPostfilterCeiling.postfilter_ceiling.coverage_pass_rows,
                coverage_gate_pass:
                  deterministicPostfilterCeiling.postfilter_ceiling.coverage_gate_pass,
              }
            : null,
          interpretation:
            "For the current browser product path, two non-collapsed boxes are sufficient evidence because active pass/fail does not consume Detector0 slots or anatomical L/R identity.",
        },
        future_tracker_slot_contract: {
          status: futureSlotDistinctAssignmentPass
            ? "passed_future_distinct_assignment_metric_only"
            : "open_future_slot_identity_gate",
          applies_when:
            "a promoted tracker, avatar driver, feedback module, or future recognizer explicitly consumes stable hand slots or anatomical left/right identity",
          distinct_lr_assignment_required_if_consumed: ">= 0.98",
          current_measurements: {
            top2nms_distinct_assignment:
              heuristicTop2NmsBaseline.distinct_assigned_coverage,
            named_postfilter_distinct_assignment:
              deterministicPostfilterCeiling?.postfilter_ceiling?.distinct_assigned_coverage ?? null,
            named_postfilter_unrecovered_distinct_failures:
              deterministicPostfilterCeiling?.postfilter_ceiling
                ?.unrecovered_distinct_failure_rows ?? null,
            current_pair_ranker_distinct_assignment:
              proposalMetrics.current_pair_ranker_distinct_assigned_coverage,
          },
          missing_receipts: [
            "stable slot identity / swap-rate receipt over two-hand clips",
            "dual-track collapse receipt against user/browser failure frames",
            "stale-box confidence decay receipt",
            "browser /tracking parity receipt once tracker artifacts are enabled",
          ],
          interpretation:
            "The 0.98 distinct L/R assignment metric remains a future slot/tracker contract, not a blocker for the current raw-frame pass/fail recognizer.",
        },
        human_gate_reframe_flag:
          productGateQuestion?.human_gate_reframe_flag ?? false,
        next_local_options: [
          "define a runtime-available low-target/quality filter for the remaining recoverable selector row",
          "write the future tracker/slot contract before any bounded learned selector returns",
        ],
      }
    : null;

  const summarizeQualityGroup = (receipt, group) => {
    const data = receipt.groups?.[group] ?? {};
    return {
      samples: data.samples ?? null,
      pck_010: round(data.PCK),
      visible_pck_010: round(data.visible_PCK),
      mean_kp_err: round(data.mean_kp_err),
      visible_mean_kp_err: round(data.visible_mean_kp_err),
    };
  };
  const summarizeRelabelCandidates = (receipt, filePath) => {
    if (!receipt.schema_version) return null;
    const dominantRecommendedAction = Object.entries(receipt.recommended_action_counts ?? {})
      .sort((a, b) => b[1] - a[1])[0] ?? [null, null];
    return {
      schema_version: receipt.schema_version,
      split: receipt.split ?? null,
      receipt: rel(filePath),
      status: "ready_for_local_crop_rebuild_or_teacher_relabel_review",
      available_candidate_count: receipt.available_candidate_count ?? null,
      selected_candidate_count: receipt.selected_candidate_count ?? null,
      candidate_topk: receipt.candidate_topk ?? null,
      dominant_recommended_action: {
        action: dominantRecommendedAction[0],
        count: dominantRecommendedAction[1],
      },
      recommended_action_counts: receipt.recommended_action_counts ?? {},
      selected_bucket_counts: receipt.selected_bucket_counts ?? {},
      top_candidates: Array.isArray(receipt.candidates)
        ? receipt.candidates.slice(0, 3).map((candidate) => ({
            index: candidate.index ?? null,
            split: candidate.split ?? null,
            pck_010: round(candidate.PCK),
            mean_kp_err: round(candidate.mean_kp_err),
            buckets: candidate.buckets ?? [],
            recommended_action: candidate.recommended_action ?? null,
            source: {
              source_cache: candidate.source?.source_cache ?? null,
              source_row_index: candidate.source?.source_row_index ?? null,
              hand_key: candidate.source?.hand_key ?? null,
              label_id: candidate.source?.label_id ?? null,
              clip_id: candidate.source?.clip_id ?? null,
              video_frame_index: candidate.source?.video_frame_index ?? null,
            },
          }))
        : [],
    };
  };
  const summarizeCandidateVisibilityPolicy = (receipt) => {
    const candidates = Array.isArray(receipt.candidates) ? receipt.candidates : [];
    const pckValues = candidates.map((candidate) => candidate.PCK);
    const visiblePckValues = candidates.map((candidate) => candidate.visible_PCK);
    const visibleDeltas = candidates.map((candidate) => {
      if (typeof candidate.PCK !== "number" || typeof candidate.visible_PCK !== "number") {
        return null;
      }
      return candidate.visible_PCK - candidate.PCK;
    });
    const averageDelta = (rows) => average(rows.map((candidate) => {
      if (typeof candidate.PCK !== "number" || typeof candidate.visible_PCK !== "number") {
        return null;
      }
      return candidate.visible_PCK - candidate.PCK;
    }));
    const oobCandidates = candidates.filter((candidate) => candidate.geometry?.oob === true);
    const edgeCandidates = candidates.filter((candidate) => candidate.geometry?.edge === true);
    return {
      split: receipt.split ?? null,
      selected_candidate_count: candidates.length,
      average_pck_010: round(average(pckValues)),
      average_visible_pck_010: round(average(visiblePckValues)),
      average_visible_minus_all_pck_010: round(average(visibleDeltas)),
      candidates_with_visible_pck_gt_pck: candidates.filter((candidate) =>
        typeof candidate.PCK === "number"
          && typeof candidate.visible_PCK === "number"
          && candidate.visible_PCK > candidate.PCK
      ).length,
      candidates_with_visible_delta_gte_010: visibleDeltas.filter((delta) =>
        typeof delta === "number" && delta >= 0.1
      ).length,
      visible_pck_gte_090: candidates.filter((candidate) =>
        typeof candidate.visible_PCK === "number" && candidate.visible_PCK >= 0.9
      ).length,
      visible_pck_lt_090: candidates.filter((candidate) =>
        typeof candidate.visible_PCK === "number" && candidate.visible_PCK < 0.9
      ).length,
      oob_candidate_count: oobCandidates.length,
      oob_average_visible_delta: round(averageDelta(oobCandidates)),
      edge_candidate_count: edgeCandidates.length,
      edge_average_visible_delta: round(averageDelta(edgeCandidates)),
    };
  };
  const summarizeQualityVisibilityDelta = (receipt, group) => {
    const data = receipt.groups?.[group] ?? {};
    return {
      samples: data.samples ?? null,
      pck_010: round(data.PCK),
      visible_pck_010: round(data.visible_PCK),
      visible_minus_all_pck_010:
        typeof data.PCK === "number" && typeof data.visible_PCK === "number"
          ? round(data.visible_PCK - data.PCK)
          : null,
      mean_kp_err: round(data.mean_kp_err),
      visible_mean_kp_err: round(data.visible_mean_kp_err),
      mean_kp_err_drop_when_visible_only:
        typeof data.mean_kp_err === "number" && typeof data.visible_mean_kp_err === "number"
          ? round(data.mean_kp_err - data.visible_mean_kp_err)
        : null,
    };
  };
  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const expandSourceCropBox = (box, expand) => {
    const [x0, y0, x1, y1] = box.map(Number);
    const width = Math.max(1e-6, x1 - x0);
    const height = Math.max(1e-6, y1 - y0);
    return [
      clamp01(x0 - expand.x * width),
      clamp01(y0 - expand.top * height),
      clamp01(x1 + expand.x * width),
      clamp01(y1 + expand.bottom * height),
    ];
  };
  const mapBoxBetweenCrops = (box, oldCrop, newCrop) => {
    const [oldX0, oldY0, oldX1, oldY1] = oldCrop.map(Number);
    const [newX0, newY0, newX1, newY1] = newCrop.map(Number);
    const oldWidth = Math.max(1e-6, oldX1 - oldX0);
    const oldHeight = Math.max(1e-6, oldY1 - oldY0);
    const newWidth = Math.max(1e-6, newX1 - newX0);
    const newHeight = Math.max(1e-6, newY1 - newY0);
    const [x0, y0, x1, y1] = box.map(Number);
    const fullFrameBox = [
      oldX0 + x0 * oldWidth,
      oldY0 + y0 * oldHeight,
      oldX0 + x1 * oldWidth,
      oldY0 + y1 * oldHeight,
    ];
    return [
      (fullFrameBox[0] - newX0) / newWidth,
      (fullFrameBox[1] - newY0) / newHeight,
      (fullFrameBox[2] - newX0) / newWidth,
      (fullFrameBox[3] - newY0) / newHeight,
    ];
  };
  const boxTouchesUnitEdge = (box, epsilon = 1e-6) =>
    Array.isArray(box)
    && (box[0] <= epsilon || box[1] <= epsilon || box[2] >= 1 - epsilon || box[3] >= 1 - epsilon);
  const boxMinUnitMargin = (box) =>
    Array.isArray(box) ? Math.min(box[0], box[1], 1 - box[2], 1 - box[3]) : null;
  const sourceVideoPathForCandidate = (candidate) => {
    const source = candidate.source ?? {};
    const sourceCache = source.source_cache ?? "";
    if (sourceCache.includes("handcrop-ac")) {
      return source.clip_id ? path.join(sideRawAslCitizenVideos, `${source.clip_id}.mp4`) : null;
    }
    const splitDirs = { train: "train", validation: "val", test: "test" };
    const splitDir = splitDirs[candidate.split ?? source.split];
    if (!splitDir || !source.label_id || !source.clip_id) return null;
    return path.join(sideRawPopSignGame, splitDir, source.label_id, `${source.clip_id}.mp4`);
  };
  const sortedCounts = (rows, keyFn, limit = 10) =>
    Object.fromEntries(Object.entries(rows.reduce((counts, row) => {
      const key = keyFn(row) ?? "unknown";
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit));
  const summarizeCropContextGeometry = (receipt) => {
    const sourceExpand = { x: 0.18, top: 0.25, bottom: 0.18 };
    const rows = (Array.isArray(receipt.candidates) ? receipt.candidates : [])
      .map((candidate) => {
        const source = candidate.source ?? {};
        const sourceCrop = source.source_signing_crop_box_xyxy;
        const teacherBox = source.teacher_hand_box_xyxy_in_source_crop;
        const perhandCrop = source.perhand_crop_box_xyxy_in_source_crop;
        if (!sourceCrop || !teacherBox || !perhandCrop) return null;
        const expandedSourceCrop = expandSourceCropBox(sourceCrop, sourceExpand);
        const teacherInExpandedCrop = mapBoxBetweenCrops(
          teacherBox,
          sourceCrop,
          expandedSourceCrop,
        );
        const teacherInFullFrame = mapBoxBetweenCrops(teacherBox, sourceCrop, [0, 0, 1, 1]);
        return {
          teacherTouchesSourceCropEdge: boxTouchesUnitEdge(teacherBox),
          teacherTouchesExpandedSourceCropEdge: boxTouchesUnitEdge(teacherInExpandedCrop),
          teacherTouchesFullFrameEdge: boxTouchesUnitEdge(teacherInFullFrame),
          sourceCropTouchesFrameEdge: boxTouchesUnitEdge(sourceCrop),
          sourceCropIsFullFrame:
            sourceCrop[0] <= 1e-6
            && sourceCrop[1] <= 1e-6
            && sourceCrop[2] >= 1 - 1e-6
            && sourceCrop[3] >= 1 - 1e-6,
          currentPerhandCropTouchesEdge: boxTouchesUnitEdge(perhandCrop),
          teacherMarginBefore: boxMinUnitMargin(teacherBox),
          teacherMarginAfterDefaultSourceExpand: boxMinUnitMargin(teacherInExpandedCrop),
          teacherMarginFullFrame: boxMinUnitMargin(teacherInFullFrame),
        };
      })
      .filter(Boolean);
    const count = (predicate) => rows.filter(predicate).length;
    const teacherEdgeCount = count((row) => row.teacherTouchesSourceCropEdge);
    const defaultResolvedCount = count((row) =>
      row.teacherTouchesSourceCropEdge && !row.teacherTouchesExpandedSourceCropEdge
    );
    const fullFrameResolvedCount = count((row) =>
      row.teacherTouchesSourceCropEdge && !row.teacherTouchesFullFrameEdge
    );
    const fullFrameUnresolvedCount = count((row) =>
      row.teacherTouchesSourceCropEdge && row.teacherTouchesFullFrameEdge
    );
    return {
      split: receipt.split ?? null,
      selected_candidate_count: rows.length,
      policy_tested:
        "Expand the original source/signing crop with targeted_relabel defaults, then rebuild per-hand crops from the preserved teacher box.",
      source_expand_defaults: sourceExpand,
      teacher_edge_count: teacherEdgeCount,
      source_expand_resolved_teacher_edge_count: defaultResolvedCount,
      source_expand_resolve_rate: round(
        teacherEdgeCount > 0 ? defaultResolvedCount / teacherEdgeCount : null,
      ),
      full_frame_relabel_crop_resolved_teacher_edge_count: fullFrameResolvedCount,
      full_frame_relabel_crop_unresolved_teacher_edge_count: fullFrameUnresolvedCount,
      full_frame_relabel_crop_resolve_rate: round(
        teacherEdgeCount > 0 ? fullFrameResolvedCount / teacherEdgeCount : null,
      ),
      current_perhand_crop_touches_edge_count:
        count((row) => row.currentPerhandCropTouchesEdge),
      source_crop_touches_frame_edge_count:
        count((row) => row.sourceCropTouchesFrameEdge),
      source_crop_full_frame_count:
        count((row) => row.sourceCropIsFullFrame),
      average_teacher_margin_before: round(average(rows.map((row) => row.teacherMarginBefore))),
      average_teacher_margin_after_default_source_expand:
        round(average(rows.map((row) => row.teacherMarginAfterDefaultSourceExpand))),
      average_teacher_margin_full_frame:
        round(average(rows.map((row) => row.teacherMarginFullFrame))),
    };
  };
  const candidateTouchesFullFrameEdge = (candidate) => {
    const source = candidate.source ?? {};
    const sourceCrop = source.source_signing_crop_box_xyxy;
    const teacherBox = source.teacher_hand_box_xyxy_in_source_crop;
    if (!sourceCrop || !teacherBox) return false;
    return boxTouchesUnitEdge(mapBoxBetweenCrops(teacherBox, sourceCrop, [0, 0, 1, 1]));
  };
  const summarizeTargetedRelabelQueue = (receipt, filePath) => {
    const candidates = Array.isArray(receipt.candidates) ? receipt.candidates : [];
    const rows = candidates
      .map((candidate) => {
        const source = candidate.source ?? {};
        const sourceCrop = source.source_signing_crop_box_xyxy;
        const teacherBox = source.teacher_hand_box_xyxy_in_source_crop;
        if (!sourceCrop || !teacherBox) return null;
        const teacherBoxFullFrame = mapBoxBetweenCrops(teacherBox, sourceCrop, [0, 0, 1, 1]);
        const rawVideo = sourceVideoPathForCandidate(candidate);
        return {
          candidate,
          source,
          teacherBoxFullFrame,
          teacherTouchesFullFrameEdge: boxTouchesUnitEdge(teacherBoxFullFrame),
          rawVideo,
          rawVideoExists: rawVideo ? exists(rawVideo) : false,
        };
      })
      .filter((row) => row?.teacherTouchesFullFrameEdge);
    const manifestTop32 = candidates.slice(0, 32);
    const manifestTop64 = candidates.slice(0, 64);
    const top32Queue = rows.slice(0, 32);
    const uniqueClips = new Set(rows.map((row) => row.source.clip_id).filter(Boolean));
    return {
      split: receipt.split ?? null,
      receipt: rel(filePath),
      queue_definition:
        "Fixed relabel candidates whose preserved teacher hand box still touches the full-frame edge after source-crop-to-full-frame mapping.",
      selected_candidate_count: candidates.length,
      frame_edge_candidate_count: rows.length,
      raw_video_available_count: rows.filter((row) => row.rawVideoExists).length,
      raw_video_missing_count: rows.filter((row) => !row.rawVideoExists).length,
      unique_clip_count: uniqueClips.size,
      manifest_prefix_frame_edge_counts: {
        top32: manifestTop32.filter(candidateTouchesFullFrameEdge).length,
        top64: manifestTop64.filter(candidateTouchesFullFrameEdge).length,
      },
      top32_queue: {
        candidate_count: top32Queue.length,
        raw_video_available_count: top32Queue.filter((row) => row.rawVideoExists).length,
        source_cache_counts: sortedCounts(top32Queue, (row) => row.source.source_cache),
        hand_key_counts: sortedCounts(top32Queue, (row) => row.source.hand_key),
        label_counts: sortedCounts(top32Queue, (row) => row.source.label_id, 20),
      },
      source_cache_counts: sortedCounts(rows, (row) => row.source.source_cache),
      hand_key_counts: sortedCounts(rows, (row) => row.source.hand_key),
      top_label_counts: sortedCounts(rows, (row) => row.source.label_id),
      recommended_action_counts: sortedCounts(rows, (row) => row.candidate.recommended_action),
      sample_candidates: rows.slice(0, 5).map((row) => ({
        index: row.candidate.index ?? null,
        label_id: row.source.label_id ?? null,
        clip_id: row.source.clip_id ?? null,
        hand_key: row.source.hand_key ?? null,
        pck_010: round(row.candidate.PCK),
        visible_pck_010: round(row.candidate.visible_PCK),
        teacher_box_full_frame: row.teacherBoxFullFrame.map((value) => round(value)),
        raw_video: row.rawVideo ? rel(row.rawVideo) : null,
        raw_video_exists: row.rawVideoExists,
      })),
    };
  };
  const summarizeTargetedRelabelSmoke = (receipt, filePath) => {
    if (!receipt.schema_version) return null;
    const stats = receipt.stats ?? {};
    const safeDiv = (num, den) =>
      typeof num === "number" && typeof den === "number" && den > 0 ? round(num / den) : null;
    return {
      schema_version: receipt.schema_version,
      receipt: rel(filePath),
      label_source: receipt.label_source ?? null,
      disclosure: receipt.disclosure ?? null,
      candidate_manifest: receipt.candidate_manifest ?? null,
      acceptance: receipt.acceptance ?? null,
      crop_px: receipt.crop_px ?? null,
      mp_px: receipt.mp_px ?? null,
      expand: receipt.expand ?? null,
      stats: {
        candidates: stats.candidates ?? null,
        processed: stats.processed ?? null,
        missing: stats.missing ?? null,
        detected: stats.detected ?? null,
        selected_detected: stats.selected_detected ?? null,
        written: stats.written ?? null,
        rejected_unselected: stats.rejected_unselected ?? null,
        rejected_visible_frac: stats.rejected_visible_frac ?? null,
        rejected_oob_points: stats.rejected_oob_points ?? null,
        rejected_center_distance: stats.rejected_center_distance ?? null,
        processed_rate: safeDiv(stats.processed, stats.candidates),
        selected_detection_rate: safeDiv(stats.selected_detected, stats.processed),
        strict_write_rate: safeDiv(stats.written, stats.processed),
      },
      sample_written_rows: Array.isArray(receipt.rows)
        ? receipt.rows.slice(0, 3).map((row) => ({
            split: row.split ?? null,
            label_id: row.label_id ?? null,
            clip_id: row.clip_id ?? null,
            video_frame_index: row.video_frame_index ?? null,
            candidate_index: row.candidate?.index ?? null,
            source_cache: row.candidate?.source_cache ?? null,
            source_row_index: row.candidate?.source_row_index ?? null,
            requested_hand_key: row.candidate?.hand_key ?? null,
            selected_relabel_hand_key: row.candidate?.selected_relabel_hand_key ?? null,
            selected_relabel_center_dist:
              round(row.candidate?.selected_relabel_center_dist),
            selected_visible_frac:
              round(row.candidate?.selected_relabel_quality?.visible_frac),
            selected_oob_points:
              row.candidate?.selected_relabel_quality?.oob_points ?? null,
          }))
        : [],
    };
  };
  const qualitySummary = (rows) => {
    const values = rows.map((row) => row.candidate?.selected_relabel_quality ?? {});
    const visible = values
      .map((value) => value.visible_frac)
      .filter((value) => typeof value === "number")
      .sort((a, b) => a - b);
    const oob = values
      .map((value) => value.oob_points)
      .filter((value) => typeof value === "number")
      .sort((a, b) => a - b);
    const percentile = (items, pct) => {
      if (!items.length) return null;
      const index = Math.min(items.length - 1, Math.floor((items.length - 1) * pct));
      return round(items[index]);
    };
    const count = (predicate) => rows.filter((row) => {
      const quality = row.candidate?.selected_relabel_quality ?? {};
      return predicate(quality, row);
    }).length;
    const selectedMatchesRequested = rows.filter((row) =>
      row.candidate?.hand_key === row.candidate?.selected_relabel_hand_key
    ).length;
    return {
      selected_row_count: rows.length,
      selected_matches_requested_hand_key: selectedMatchesRequested,
      selected_mismatches_requested_hand_key: rows.length - selectedMatchesRequested,
      center_distance_lte_035: count((_, row) =>
        typeof row.candidate?.selected_relabel_center_dist === "number"
        && row.candidate.selected_relabel_center_dist <= 0.35
      ),
      visible_frac: {
        min: percentile(visible, 0),
        p25: percentile(visible, 0.25),
        median: percentile(visible, 0.5),
        p75: percentile(visible, 0.75),
        max: percentile(visible, 1),
      },
      oob_points: {
        min: percentile(oob, 0),
        p25: percentile(oob, 0.25),
        median: percentile(oob, 0.5),
        p75: percentile(oob, 0.75),
        max: percentile(oob, 1),
      },
      threshold_counts: {
        visible_075_oob_0: count((quality) =>
          quality.visible_frac >= 0.75 && quality.oob_points === 0
        ),
        visible_075_oob_lte_2: count((quality) =>
          quality.visible_frac >= 0.75 && quality.oob_points <= 2
        ),
        visible_050_oob_lte_4: count((quality) =>
          quality.visible_frac >= 0.5 && quality.oob_points <= 4
        ),
        visible_050_oob_lte_4_center_lte_035: count((quality, row) =>
          quality.visible_frac >= 0.5
          && quality.oob_points <= 4
          && typeof row.candidate?.selected_relabel_center_dist === "number"
          && row.candidate.selected_relabel_center_dist <= 0.35
        ),
      },
    };
  };
  const summarizeSelectedOnlyRelabelDiagnostic = (receipt, filePath) => {
    const summary = summarizeTargetedRelabelSmoke(receipt, filePath);
    if (!summary) return null;
    const rows = Array.isArray(receipt.rows) ? receipt.rows : [];
    return {
      ...summary,
      selected_quality_summary: qualitySummary(rows),
    };
  };
  const classifySelectedOnlyRelabelRowForCachePolicy = (row) => {
    const candidate = row.candidate ?? {};
    const quality = candidate.selected_relabel_quality ?? {};
    const visibleFrac = quality.visible_frac;
    const oobPoints = quality.oob_points;
    const centerDistance = candidate.selected_relabel_center_dist;
    const handKeyMatches =
      candidate.hand_key === candidate.selected_relabel_hand_key;
    const moderateQuality =
      typeof visibleFrac === "number"
      && visibleFrac >= 0.5
      && typeof oobPoints === "number"
      && oobPoints <= 4
      && typeof centerDistance === "number"
      && centerDistance <= 0.35
      && handKeyMatches;
    const strictQuality =
      typeof visibleFrac === "number"
      && visibleFrac >= 0.75
      && oobPoints === 0
      && typeof centerDistance === "number"
      && centerDistance <= 0.35
      && handKeyMatches;
    const severeFrameEdge =
      typeof visibleFrac !== "number"
      || visibleFrac < 0.5
      || typeof oobPoints !== "number"
      || oobPoints > 4;
    return {
      hand_key_matches_requested: handKeyMatches,
      selected_visible_frac: round(visibleFrac),
      selected_oob_points: typeof oobPoints === "number" ? oobPoints : null,
      selected_center_distance: round(centerDistance),
      cache_rebuild_eligible_moderate: moderateQuality,
      cache_rebuild_eligible_strict: strictQuality,
      exclude_as_severe_frame_edge_oob: severeFrameEdge,
      exclude_for_hand_key_mismatch: !handKeyMatches,
      exclude_for_center_distance:
        typeof centerDistance !== "number" || centerDistance > 0.35,
    };
  };
  const summarizeSelectedOnlyFrameEdgePolicy = (receipt, filePath) => {
    const summary = summarizeTargetedRelabelSmoke(receipt, filePath);
    if (!summary) return null;
    const rows = Array.isArray(receipt.rows) ? receipt.rows : [];
    const classified = rows.map((row) => ({
      row,
      policy: classifySelectedOnlyRelabelRowForCachePolicy(row),
    }));
    const count = (predicate) => classified.filter(({ policy }) => predicate(policy)).length;
    return {
      split: receipt.split ?? null,
      receipt: rel(filePath),
      selected_row_count: rows.length,
      cache_rebuild_eligible_moderate_count:
        count((policy) => policy.cache_rebuild_eligible_moderate),
      cache_rebuild_eligible_strict_count:
        count((policy) => policy.cache_rebuild_eligible_strict),
      severe_frame_edge_oob_exclusion_count:
        count((policy) => policy.exclude_as_severe_frame_edge_oob),
      hand_key_mismatch_exclusion_count:
        count((policy) => policy.exclude_for_hand_key_mismatch),
      center_distance_exclusion_count:
        count((policy) => policy.exclude_for_center_distance),
      selected_quality_summary: qualitySummary(rows),
      sample_policy_rows: classified.slice(0, 5).map(({ row, policy }) => ({
        split: row.split ?? null,
        label_id: row.label_id ?? null,
        clip_id: row.clip_id ?? null,
        video_frame_index: row.video_frame_index ?? null,
        candidate_index: row.candidate?.index ?? null,
        requested_hand_key: row.candidate?.hand_key ?? null,
        selected_relabel_hand_key:
          row.candidate?.selected_relabel_hand_key ?? null,
        ...policy,
      })),
    };
  };
  const summarizeFrameEdgePolicyDecision = (
    trainReceipt,
    trainPath,
    testReceipt,
    testPath,
    relabelQueue,
  ) => {
    if (!trainReceipt.schema_version || !testReceipt.schema_version) return null;
    const trainPolicy = summarizeSelectedOnlyFrameEdgePolicy(trainReceipt, trainPath);
    const testPolicy = summarizeSelectedOnlyFrameEdgePolicy(testReceipt, testPath);
    const aggregate = {
      selected_row_count:
        (trainPolicy?.selected_row_count ?? 0) + (testPolicy?.selected_row_count ?? 0),
      cache_rebuild_eligible_moderate_count:
        (trainPolicy?.cache_rebuild_eligible_moderate_count ?? 0)
        + (testPolicy?.cache_rebuild_eligible_moderate_count ?? 0),
      cache_rebuild_eligible_strict_count:
        (trainPolicy?.cache_rebuild_eligible_strict_count ?? 0)
        + (testPolicy?.cache_rebuild_eligible_strict_count ?? 0),
      severe_frame_edge_oob_exclusion_count:
        (trainPolicy?.severe_frame_edge_oob_exclusion_count ?? 0)
        + (testPolicy?.severe_frame_edge_oob_exclusion_count ?? 0),
      hand_key_mismatch_exclusion_count:
        (trainPolicy?.hand_key_mismatch_exclusion_count ?? 0)
        + (testPolicy?.hand_key_mismatch_exclusion_count ?? 0),
      center_distance_exclusion_count:
        (trainPolicy?.center_distance_exclusion_count ?? 0)
        + (testPolicy?.center_distance_exclusion_count ?? 0),
    };
    return {
      status:
        "selected_only_frame_edge_rows_excluded_from_cache_rebuild_clearer_source_required",
      policy_thresholds: {
        cache_rebuild_min_visible_frac: 0.5,
        cache_rebuild_max_oob_points: 4,
        max_selected_center_distance: 0.35,
        require_selected_hand_key_match: true,
        strict_min_visible_frac: 0.75,
        strict_max_oob_points: 0,
      },
      train_top32_policy: trainPolicy,
      test_top32_policy: testPolicy,
      full_backlog_scope: {
        train_frame_edge_candidates:
          relabelQueue?.train_candidates?.frame_edge_candidate_count ?? null,
        test_frame_edge_candidates:
          relabelQueue?.test_candidates?.frame_edge_candidate_count ?? null,
        raw_video_missing_train:
          relabelQueue?.train_candidates?.raw_video_missing_count ?? null,
        raw_video_missing_test:
          relabelQueue?.test_candidates?.raw_video_missing_count ?? null,
      },
      aggregate,
      decision:
        "Do not rebuild a landmark cache from selected-only frame-edge/OOB relabel rows unless they pass moderate visible/OOB quality, center-distance, and requested-hand-key checks. Under that policy, 0/52 selected-only top-32 rows are cache-eligible; 51/52 remain severe frame-edge/OOB exclusions and the remaining row is excluded by hand-key mismatch. Route this backlog to true-frame-edge exclusion, partial-label masking only for explicitly visible keypoints, or clearer-source review before any cache rebuild.",
      recommended_next_action:
        "materialize_frame_edge_exclusion_or_clearer_source_review_manifest_before_landmark_cache_rebuild_local_no_brev",
      runtime_promotion: false,
      brev_used: false,
      training_run: false,
    };
  };
  const selectedOnlyPolicyByCandidate = (receipt) => {
    const rows = Array.isArray(receipt.rows) ? receipt.rows : [];
    return new Map(rows.map((row) => {
      const policy = classifySelectedOnlyRelabelRowForCachePolicy(row);
      const key = `${row.split}:${row.candidate?.index}`;
      const exclusionReasons = [];
      if (policy.exclude_as_severe_frame_edge_oob) {
        exclusionReasons.push("severe_frame_edge_or_oob");
      }
      if (policy.exclude_for_hand_key_mismatch) {
        exclusionReasons.push("selected_hand_key_mismatch");
      }
      if (policy.exclude_for_center_distance) {
        exclusionReasons.push("selected_center_distance_gt_0_35");
      }
      return [key, {
        probed: true,
        selected_relabel_hand_key: row.candidate?.selected_relabel_hand_key ?? null,
        selected_visible_frac: policy.selected_visible_frac,
        selected_oob_points: policy.selected_oob_points,
        selected_center_distance: policy.selected_center_distance,
        hand_key_matches_requested: policy.hand_key_matches_requested,
        cache_rebuild_eligible_moderate: policy.cache_rebuild_eligible_moderate,
        cache_rebuild_eligible_strict: policy.cache_rebuild_eligible_strict,
        exclusion_reasons: exclusionReasons,
      }];
    }));
  };
  const dispositionForCandidate = (selectedPolicy, rawVideoExists) => {
    if (selectedPolicy?.cache_rebuild_eligible_moderate) {
      return "cache_rebuild_candidate_requires_manual_review";
    }
    if (selectedPolicy?.probed) {
      return "exclude_selected_only_frame_edge_oob_from_cache_rebuild";
    }
    if (!rawVideoExists) return "blocked_missing_raw_source";
    return "clearer_source_review_required_before_cache_rebuild";
  };
  const dispositionCounts = (rows) =>
    Object.fromEntries(Object.entries(rows.reduce((counts, row) => {
      counts[row.disposition] = (counts[row.disposition] ?? 0) + 1;
      return counts;
    }, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
  const countRows = (rows, predicate) => rows.filter(predicate).length;
  const summarizeDispositionRows = (rows) => ({
    rows: rows.length,
    selected_only_probe_rows: countRows(rows, (row) => row.selected_only_policy?.probed),
    cache_rebuild_allowed: countRows(rows, (row) => row.cache_rebuild_allowed),
    raw_video_missing: countRows(rows, (row) => !row.raw_video_exists),
    selected_only_excluded_from_cache_rebuild: countRows(
      rows,
      (row) => row.disposition === "exclude_selected_only_frame_edge_oob_from_cache_rebuild",
    ),
    clearer_source_review_required: countRows(
      rows,
      (row) => row.disposition === "clearer_source_review_required_before_cache_rebuild",
    ),
    severe_frame_edge_oob: countRows(
      rows,
      (row) => row.selected_only_policy?.exclusion_reasons?.includes("severe_frame_edge_or_oob"),
    ),
    hand_key_mismatch: countRows(
      rows,
      (row) => row.selected_only_policy?.exclusion_reasons?.includes(
        "selected_hand_key_mismatch",
      ),
    ),
    center_distance: countRows(
      rows,
      (row) => row.selected_only_policy?.exclusion_reasons?.includes(
        "selected_center_distance_gt_0_35",
      ),
    ),
    disposition_counts: dispositionCounts(rows),
  });
  const buildFrameEdgeDispositionRows = (candidateReceipt, selectedOnlyReceipt) => {
    const selectedPolicies = selectedOnlyPolicyByCandidate(selectedOnlyReceipt);
    const candidates = Array.isArray(candidateReceipt.candidates) ? candidateReceipt.candidates : [];
    return candidates.filter(candidateTouchesFullFrameEdge).map((candidate) => {
      const source = candidate.source ?? {};
      const sourceCrop = source.source_signing_crop_box_xyxy;
      const teacherBox = source.teacher_hand_box_xyxy_in_source_crop;
      const teacherBoxFullFrame = sourceCrop && teacherBox
        ? mapBoxBetweenCrops(teacherBox, sourceCrop, [0, 0, 1, 1])
        : null;
      const rawVideo = sourceVideoPathForCandidate(candidate);
      const rawVideoExists = rawVideo ? exists(rawVideo) : false;
      const selectedPolicy =
        selectedPolicies.get(`${candidate.split}:${candidate.index}`) ?? null;
      const disposition = dispositionForCandidate(selectedPolicy, rawVideoExists);
      return {
        split: candidate.split ?? candidateReceipt.split ?? null,
        candidate_index: candidate.index ?? null,
        source_cache: source.source_cache ?? null,
        source_row_index: source.source_row_index ?? null,
        hand_key: source.hand_key ?? null,
        label_id: source.label_id ?? null,
        clip_id: source.clip_id ?? null,
        video_frame_index: source.video_frame_index ?? null,
        pck_010: round(candidate.PCK),
        visible_pck_010: round(candidate.visible_PCK),
        mean_kp_err: round(candidate.mean_kp_err),
        visible_mean_kp_err: round(candidate.visible_mean_kp_err),
        buckets: candidate.buckets ?? [],
        recommended_action: candidate.recommended_action ?? null,
        teacher_box_full_frame: Array.isArray(teacherBoxFullFrame)
          ? teacherBoxFullFrame.map((value) => round(value))
          : null,
        raw_video: rawVideo ? rel(rawVideo) : null,
        raw_video_exists: rawVideoExists,
        selected_only_policy: selectedPolicy,
        disposition,
        cache_rebuild_allowed:
          disposition === "cache_rebuild_candidate_requires_manual_review",
      };
    });
  };
  const buildFrameEdgeDispositionManifest = (
    trainCandidateReceipt,
    trainCandidatePath,
    testCandidateReceipt,
    testCandidatePath,
    trainSelectedOnlyReceipt,
    trainSelectedOnlyPath,
    testSelectedOnlyReceipt,
    testSelectedOnlyPath,
    frameEdgePolicy,
  ) => {
    if (!frameEdgePolicy) return null;
    const trainRows = buildFrameEdgeDispositionRows(
      trainCandidateReceipt,
      trainSelectedOnlyReceipt,
    );
    const testRows = buildFrameEdgeDispositionRows(
      testCandidateReceipt,
      testSelectedOnlyReceipt,
    );
    const rows = [...trainRows, ...testRows];
    const summary = summarizeDispositionRows(rows);
    return {
      schema_version: "asl-pilot-m3jb-frame-edge-disposition-manifest/v1",
      manifest_id: "return-to-form-m3jb-frame-edge-disposition-manifest-v1",
      generated_by: "scripts/audit_m3jb_hand_state_tracker.mjs",
      scope: {
        type: "full_train_test_true_frame_edge_backlog",
        frame_edge_candidates: rows.length,
        selected_only_probe_rows: summary.selected_only_probe_rows,
        full_backlog_train_frame_edge_candidates:
          frameEdgePolicy.full_backlog_scope?.train_frame_edge_candidates ?? null,
        full_backlog_test_frame_edge_candidates:
          frameEdgePolicy.full_backlog_scope?.test_frame_edge_candidates ?? null,
        full_backlog_materialized: true,
      },
      source_receipts: {
        train_candidates: {
          path: rel(trainCandidatePath),
          sha256: exists(trainCandidatePath) ? sha256(trainCandidatePath) : null,
        },
        test_candidates: {
          path: rel(testCandidatePath),
          sha256: exists(testCandidatePath) ? sha256(testCandidatePath) : null,
        },
        train_selected_only:
          {
            path: rel(trainSelectedOnlyPath),
            sha256: exists(trainSelectedOnlyPath) ? sha256(trainSelectedOnlyPath) : null,
          },
        test_selected_only:
          {
            path: rel(testSelectedOnlyPath),
            sha256: exists(testSelectedOnlyPath) ? sha256(testSelectedOnlyPath) : null,
          },
      },
      runtime_boundary: {
        offline_teacher_only: true,
        browser_runtime_dependency_added: false,
        raw_learner_video_upload: false,
        cache_rebuild_authorized_by_this_manifest: false,
      },
      policy_thresholds: frameEdgePolicy.policy_thresholds,
      summary,
      splits: {
        train: {
          summary: summarizeDispositionRows(trainRows),
          rows: trainRows,
        },
        test: {
          summary: summarizeDispositionRows(testRows),
          rows: testRows,
        },
      },
      decision:
        "This full-backlog manifest keeps all true-frame-edge/OOB rows out of landmark cache rebuild unless a later manual review marks a clearer source frame or cache-safe replacement label. Selected-only probe evidence excludes 52/52 probed rows; the remaining unprobed frame-edge rows require clearer-source review before cache rebuild.",
      next_action:
        "review_clearer_source_or_commit_frame_edge_exclusions_before_landmark_cache_rebuild_local_no_brev",
    };
  };
  const summarizeExclusionSeedRows = (rows) => ({
    rows: rows.length,
    severe_frame_edge_oob: countRows(
      rows,
      (row) => row.exclusion_reasons.includes("severe_frame_edge_or_oob"),
    ),
    hand_key_mismatch: countRows(
      rows,
      (row) => row.exclusion_reasons.includes("selected_hand_key_mismatch"),
    ),
    center_distance: countRows(
      rows,
      (row) => row.exclusion_reasons.includes("selected_center_distance_gt_0_35"),
    ),
    train_rows: countRows(rows, (row) => row.split === "train"),
    test_rows: countRows(rows, (row) => row.split === "test"),
  });
  const buildFrameEdgeExclusionSeed = (dispositionManifest, dispositionPath) => {
    if (!dispositionManifest?.schema_version) return null;
    const dispositionRows = [
      ...(dispositionManifest.splits?.train?.rows ?? []),
      ...(dispositionManifest.splits?.test?.rows ?? []),
    ];
    const rows = dispositionRows
      .filter((row) =>
        row.disposition === "exclude_selected_only_frame_edge_oob_from_cache_rebuild"
      )
      .map((row) => ({
        split: row.split ?? null,
        candidate_key: `${row.split}:${row.candidate_index}`,
        candidate_index: row.candidate_index ?? null,
        source_cache: row.source_cache ?? null,
        source_row_index: row.source_row_index ?? null,
        hand_key: row.hand_key ?? null,
        label_id: row.label_id ?? null,
        clip_id: row.clip_id ?? null,
        video_frame_index: row.video_frame_index ?? null,
        selected_relabel_hand_key:
          row.selected_only_policy?.selected_relabel_hand_key ?? null,
        selected_visible_frac:
          row.selected_only_policy?.selected_visible_frac ?? null,
        selected_oob_points:
          row.selected_only_policy?.selected_oob_points ?? null,
        selected_center_distance:
          row.selected_only_policy?.selected_center_distance ?? null,
        hand_key_matches_requested:
          row.selected_only_policy?.hand_key_matches_requested ?? null,
        exclusion_reasons: row.selected_only_policy?.exclusion_reasons ?? [],
        block_from_landmark_cache_rebuild: true,
      }));
    return {
      schema_version: "asl-pilot-m3jb-frame-edge-exclusion-seed/v1",
      seed_id: "return-to-form-m3jb-frame-edge-exclusion-seed-v1",
      generated_by: "scripts/audit_m3jb_hand_state_tracker.mjs",
      purpose:
        "Commit explicit cache-rebuild exclusions for selected-only frame-edge/OOB rows that failed the visibility/OOB, hand-key, or center-distance policy.",
      source_manifest: {
        path: frameEdgeDispositionManifestPath,
        sha256: exists(dispositionPath) ? sha256(dispositionPath) : null,
      },
      runtime_boundary: {
        offline_teacher_evidence_only: true,
        browser_runtime_dependency_added: false,
        raw_learner_video_upload: false,
        landmark_cache_rebuild_authorized: false,
      },
      policy_thresholds: dispositionManifest.policy_thresholds ?? null,
      summary: summarizeExclusionSeedRows(rows),
      rows,
      decision:
        "These 52 selected-only true-frame-edge/OOB rows are committed as explicit exclusions from landmark cache rebuild. The remaining unprobed frame-edge rows still require clearer-source review before cache rebuild.",
      next_action:
        "select_clearer_source_review_subset_for_unprobed_frame_edge_rows_local_no_brev",
    };
  };
  const edgeContactCount = (box) => {
    if (!Array.isArray(box) || box.length !== 4) return 0;
    return box.reduce((count, value, index) => {
      const touchesMin = index < 2 && value <= 0.001;
      const touchesMax = index >= 2 && value >= 0.999;
      return count + (touchesMin || touchesMax ? 1 : 0);
    }, 0);
  };
  const clearerSourceReviewPriorityScore = (row) =>
    round(
      ((row.buckets?.length ?? 0) * 10)
      + (edgeContactCount(row.teacher_box_full_frame) * 5)
      + ((1 - (row.visible_pck_010 ?? 0)) * 3)
      + (row.visible_mean_kp_err ?? 0)
      + (row.mean_kp_err ?? 0),
    );
  const medianNumber = (values) => {
    const numeric = values
      .filter((value) => typeof value === "number" && Number.isFinite(value))
      .sort((a, b) => a - b);
    if (numeric.length === 0) return null;
    const middle = Math.floor(numeric.length / 2);
    if (numeric.length % 2 === 1) return round(numeric[middle]);
    return round((numeric[middle - 1] + numeric[middle]) / 2);
  };
  const summarizeClearerSourceRows = (rows) => ({
    rows: rows.length,
    train_rows: countRows(rows, (row) => row.split === "train"),
    test_rows: countRows(rows, (row) => row.split === "test"),
    unique_labels: new Set(rows.map((row) => row.label_id)).size,
    raw_video_missing: countRows(rows, (row) => row.raw_video_exists !== true),
    edge_contact_rows: countRows(rows, (row) => edgeContactCount(row.teacher_box_full_frame) > 0),
    median_priority_score: medianNumber(rows.map((row) => row.review_priority_score)),
  });
  const selectClearerSourceRowsForSplit = (rows, split, limit, labelCap) => {
    const splitRows = rows
      .filter((row) => row.split === split)
      .map((row) => ({
        ...row,
        review_priority_score: clearerSourceReviewPriorityScore(row),
        edge_contact_count: edgeContactCount(row.teacher_box_full_frame),
      }))
      .sort((a, b) =>
        (b.review_priority_score ?? -Infinity) - (a.review_priority_score ?? -Infinity)
        || String(a.label_id).localeCompare(String(b.label_id))
        || a.candidate_index - b.candidate_index
      );
    const selected = [];
    const selectedKeys = new Set();
    const labelCounts = new Map();
    for (const row of splitRows) {
      const labelCount = labelCounts.get(row.label_id) ?? 0;
      if (labelCount >= labelCap) continue;
      selected.push(row);
      selectedKeys.add(`${row.split}:${row.candidate_index}`);
      labelCounts.set(row.label_id, labelCount + 1);
      if (selected.length === limit) break;
    }
    for (const row of splitRows) {
      if (selected.length === limit) break;
      const key = `${row.split}:${row.candidate_index}`;
      if (selectedKeys.has(key)) continue;
      selected.push(row);
      selectedKeys.add(key);
    }
    return selected.map((row, index) => ({
      split: row.split ?? null,
      review_rank: index + 1,
      review_key: `${row.split}:${row.candidate_index}`,
      candidate_index: row.candidate_index ?? null,
      source_cache: row.source_cache ?? null,
      source_row_index: row.source_row_index ?? null,
      hand_key: row.hand_key ?? null,
      label_id: row.label_id ?? null,
      clip_id: row.clip_id ?? null,
      video_frame_index: row.video_frame_index ?? null,
      pck_010: row.pck_010 ?? null,
      visible_pck_010: row.visible_pck_010 ?? null,
      mean_kp_err: row.mean_kp_err ?? null,
      visible_mean_kp_err: row.visible_mean_kp_err ?? null,
      buckets: row.buckets ?? [],
      teacher_box_full_frame: row.teacher_box_full_frame ?? null,
      edge_contact_count: row.edge_contact_count,
      raw_video: row.raw_video ?? null,
      raw_video_exists: row.raw_video_exists === true,
      review_priority_score: row.review_priority_score,
      review_reason: "clearer_source_review_required_before_cache_rebuild",
      cache_rebuild_allowed: false,
    }));
  };
  const buildClearerSourceReviewSubset = (
    dispositionManifest,
    dispositionPath,
    exclusionSeedPath,
  ) => {
    if (!dispositionManifest?.schema_version) return null;
    const poolRows = [
      ...(dispositionManifest.splits?.train?.rows ?? []),
      ...(dispositionManifest.splits?.test?.rows ?? []),
    ].filter((row) =>
      row.disposition === "clearer_source_review_required_before_cache_rebuild"
    );
    const splitLimit = 32;
    const labelCap = 2;
    const trainRows = selectClearerSourceRowsForSplit(poolRows, "train", splitLimit, labelCap);
    const testRows = selectClearerSourceRowsForSplit(poolRows, "test", splitLimit, labelCap);
    const rows = [...trainRows, ...testRows];
    return {
      schema_version: "asl-pilot-m3jb-clearer-source-review-subset/v1",
      subset_id: "return-to-form-m3jb-clearer-source-review-subset-v1",
      generated_by: "scripts/audit_m3jb_hand_state_tracker.mjs",
      purpose:
        "Select a bounded, source-linked review subset from unprobed true-frame-edge/OOB rows before any landmark cache rebuild or longer heatmap training.",
      source_manifest: {
        path: frameEdgeDispositionManifestPath,
        sha256: exists(dispositionPath) ? sha256(dispositionPath) : null,
      },
      source_exclusion_seed: {
        path: frameEdgeExclusionSeedPath,
        sha256: exists(exclusionSeedPath) ? sha256(exclusionSeedPath) : null,
      },
      runtime_boundary: {
        offline_review_metadata_only: true,
        browser_runtime_dependency_added: false,
        raw_learner_video_upload: false,
        raw_frames_embedded: false,
        landmark_cache_rebuild_authorized: false,
      },
      selection_policy: {
        pool_disposition: "clearer_source_review_required_before_cache_rebuild",
        pool_rows: poolRows.length,
        split_limit: splitLimit,
        first_pass_label_cap: labelCap,
        priority_score:
          "10*bucket_count + 5*edge_contact_count + 3*(1-visible_pck_010) + visible_mean_kp_err + mean_kp_err",
        tie_breakers: ["label_id", "candidate_index"],
      },
      summary: {
        pool_rows: poolRows.length,
        pool_train_rows: countRows(poolRows, (row) => row.split === "train"),
        pool_test_rows: countRows(poolRows, (row) => row.split === "test"),
        selected_rows: rows.length,
        selected_train_rows: trainRows.length,
        selected_test_rows: testRows.length,
        selected_unique_labels: new Set(rows.map((row) => row.label_id)).size,
        raw_video_missing: countRows(rows, (row) => row.raw_video_exists !== true),
        cache_rebuild_allowed: 0,
      },
      splits: {
        train: {
          summary: summarizeClearerSourceRows(trainRows),
          rows: trainRows,
        },
        test: {
          summary: summarizeClearerSourceRows(testRows),
          rows: testRows,
        },
      },
      decision:
        "This subset is for clearer-source review only. It authorizes 0 rows for landmark cache rebuild; rows need manual/source review or later replacement labels before cache use.",
      next_action:
        "review_clearer_source_subset_and_record_cache_safe_replacements_or_exclusions_local_no_brev",
    };
  };
  const pendingReviewStatus = "pending_manual_source_review";
  const cacheSafeReplacementStatus = "cache_safe_replacement_label";
  const explicitExclusionStatus = "explicit_exclude_frame_edge_oob";
  const needsAdditionalSourceStatus = "needs_additional_source_context";
  const reviewStatusValues = [
    pendingReviewStatus,
    cacheSafeReplacementStatus,
    explicitExclusionStatus,
    needsAdditionalSourceStatus,
  ];
  const requiredCacheSafeReplacementFields = [
    "replacement_source_frame_reference",
    "replacement_box_full_frame_or_landmarks21",
    "label_provenance",
    "reviewer",
    "reviewed_at",
  ];
  const requiredExplicitExclusionFields = [
    "exclusion_reason",
    "reviewer",
    "reviewed_at",
  ];
  const hasRequiredFields = (value, fields) =>
    value != null
    && typeof value === "object"
    && fields.every((field) =>
      Object.hasOwn(value, field)
        && value[field] !== null
        && value[field] !== ""
    );
  const reviewOutcomeMutableFields = [
    "review_status",
    "cache_safe_replacement",
    "explicit_exclusion",
    "reviewer_notes",
    "cache_rebuild_allowed",
  ];
  const flattenReviewOutcomeRows = (outcomes) => [
    ...(outcomes?.splits?.train?.rows ?? []),
    ...(outcomes?.splits?.test?.rows ?? []),
  ];
  const reviewOutcomeRowsByKey = (outcomes) =>
    new Map(flattenReviewOutcomeRows(outcomes).map((row) => [row.review_key, row]));
  const reviewOutcomeIdentityMatches = (baseRow, existingRow) =>
    existingRow != null
    && baseRow.split === existingRow.split
    && baseRow.candidate_index === existingRow.candidate_index
    && baseRow.source_cache === existingRow.source_cache
    && baseRow.source_row_index === existingRow.source_row_index
    && baseRow.hand_key === existingRow.hand_key
    && baseRow.label_id === existingRow.label_id
    && baseRow.clip_id === existingRow.clip_id
    && baseRow.video_frame_index === existingRow.video_frame_index;
  const mergeExistingReviewOutcome = (baseRow, existingRowsByKey) => {
    const existingRow = existingRowsByKey.get(baseRow.review_key);
    if (!reviewOutcomeIdentityMatches(baseRow, existingRow)) return baseRow;
    const merged = { ...baseRow };
    for (const field of reviewOutcomeMutableFields) {
      if (Object.hasOwn(existingRow, field)) merged[field] = existingRow[field];
    }
    return merged;
  };
  const summarizeReviewOutcomeRows = (rows) => ({
    rows: rows.length,
    pending_review: countRows(rows, (row) => row.review_status === pendingReviewStatus),
    cache_safe_replacements: countRows(
      rows,
      (row) => row.review_status === cacheSafeReplacementStatus,
    ),
    explicit_exclusions: countRows(rows, (row) => row.review_status === explicitExclusionStatus),
    needs_additional_source_context: countRows(
      rows,
      (row) => row.review_status === needsAdditionalSourceStatus,
    ),
    cache_rebuild_allowed: countRows(rows, (row) => row.cache_rebuild_allowed === true),
    train_rows: countRows(rows, (row) => row.split === "train"),
    test_rows: countRows(rows, (row) => row.split === "test"),
  });
  const validateReviewOutcomeRows = (rows) => {
    const invalidRows = rows
      .map((row) => {
        const reasons = [];
        if (!reviewStatusValues.includes(row.review_status)) {
          reasons.push("invalid_review_status");
        }
        if (row.review_status === pendingReviewStatus) {
          if (row.cache_safe_replacement !== null) {
            reasons.push("pending_has_cache_safe_replacement");
          }
          if (row.explicit_exclusion !== null) reasons.push("pending_has_explicit_exclusion");
          if (row.cache_rebuild_allowed !== false) reasons.push("pending_allows_cache_rebuild");
        }
        if (row.review_status === needsAdditionalSourceStatus) {
          if (row.cache_safe_replacement !== null) {
            reasons.push("needs_context_has_cache_safe_replacement");
          }
          if (row.explicit_exclusion !== null) {
            reasons.push("needs_context_has_explicit_exclusion");
          }
          if (row.cache_rebuild_allowed !== false) {
            reasons.push("needs_context_allows_cache_rebuild");
          }
        }
        if (row.review_status === cacheSafeReplacementStatus) {
          if (!hasRequiredFields(row.cache_safe_replacement, requiredCacheSafeReplacementFields)) {
            reasons.push("cache_safe_replacement_missing_required_fields");
          }
          if (row.explicit_exclusion !== null) {
            reasons.push("cache_safe_replacement_has_explicit_exclusion");
          }
          if (row.cache_rebuild_allowed !== true) {
            reasons.push("cache_safe_replacement_not_cache_authorized");
          }
        }
        if (row.review_status === explicitExclusionStatus) {
          if (!hasRequiredFields(row.explicit_exclusion, requiredExplicitExclusionFields)) {
            reasons.push("explicit_exclusion_missing_required_fields");
          }
          if (row.cache_safe_replacement !== null) {
            reasons.push("explicit_exclusion_has_cache_safe_replacement");
          }
          if (row.cache_rebuild_allowed !== false) {
            reasons.push("explicit_exclusion_allows_cache_rebuild");
          }
        }
        return reasons.length === 0 ? null : {
          split: row.split,
          review_key: row.review_key,
          candidate_index: row.candidate_index,
          review_status: row.review_status,
          reasons,
        };
      })
      .filter(Boolean);
    return {
      status: invalidRows.length === 0 ? "passed" : "failed",
      invalid_rows: invalidRows.length,
      invalid_row_examples: invalidRows.slice(0, 12),
    };
  };
  const reviewOutcomeRowsForSplit = (subsetRows, existingRowsByKey) =>
    subsetRows.map((row) => {
      const baseRow = {
        split: row.split ?? null,
        review_key: row.review_key ?? `${row.split}:${row.candidate_index}`,
        review_rank: row.review_rank ?? null,
        candidate_index: row.candidate_index ?? null,
        source_cache: row.source_cache ?? null,
        source_row_index: row.source_row_index ?? null,
        raw_video: row.raw_video ?? null,
        video_frame_index: row.video_frame_index ?? null,
        hand_key: row.hand_key ?? null,
        label_id: row.label_id ?? null,
        clip_id: row.clip_id ?? null,
        teacher_box_full_frame: row.teacher_box_full_frame ?? null,
        edge_contact_count: row.edge_contact_count ?? null,
        review_priority_score: row.review_priority_score ?? null,
        review_status: pendingReviewStatus,
        reviewer_decision_allowed_values: [
          cacheSafeReplacementStatus,
          explicitExclusionStatus,
          needsAdditionalSourceStatus,
        ],
        cache_safe_replacement: null,
        explicit_exclusion: null,
        reviewer_notes: null,
        cache_rebuild_allowed: false,
      };
      return mergeExistingReviewOutcome(baseRow, existingRowsByKey);
    });
  const buildClearerSourceReviewOutcomes = (
    reviewSubset,
    reviewSubsetPath,
    existingReviewOutcomes,
  ) => {
    if (!reviewSubset?.schema_version) return null;
    const existingRowsByKey = reviewOutcomeRowsByKey(existingReviewOutcomes);
    const trainRows = reviewOutcomeRowsForSplit(
      reviewSubset.splits?.train?.rows ?? [],
      existingRowsByKey,
    );
    const testRows = reviewOutcomeRowsForSplit(
      reviewSubset.splits?.test?.rows ?? [],
      existingRowsByKey,
    );
    const rows = [...trainRows, ...testRows];
    const allRowsSummary = summarizeReviewOutcomeRows(rows);
    const summary = {
      selected_rows: allRowsSummary.rows,
      train_rows: allRowsSummary.train_rows,
      test_rows: allRowsSummary.test_rows,
      pending_review: allRowsSummary.pending_review,
      cache_safe_replacements: allRowsSummary.cache_safe_replacements,
      explicit_exclusions: allRowsSummary.explicit_exclusions,
      needs_additional_source_context:
        allRowsSummary.needs_additional_source_context,
      cache_rebuild_allowed: allRowsSummary.cache_rebuild_allowed,
    };
    const validation = validateReviewOutcomeRows(rows);
    const batchReviewFinished =
      summary.selected_rows === 64
      && summary.pending_review === 0
      && summary.cache_safe_replacements === 0
      && summary.explicit_exclusions >= 64
      && summary.needs_additional_source_context === 0
      && summary.cache_rebuild_allowed === 0
      && validation.status === "passed";
    return {
      schema_version: "asl-pilot-m3jb-clearer-source-review-outcomes/v1",
      ledger_id: "return-to-form-m3jb-clearer-source-review-outcomes-v1",
      generated_by: "scripts/audit_m3jb_hand_state_tracker.mjs",
      purpose:
        "Provide the fail-closed review destination for the 64-row clearer-source subset: reviewer outcomes must be filled here before any cache-safe replacement or explicit exclusion can affect landmark cache rebuilds.",
      source_subset: {
        path: clearerSourceReviewSubsetPath,
        sha256: exists(reviewSubsetPath) ? sha256(reviewSubsetPath) : null,
      },
      runtime_boundary: {
        offline_review_metadata_only: true,
        browser_runtime_dependency_added: false,
        raw_learner_video_upload: false,
        raw_frames_embedded: false,
        landmark_cache_rebuild_authorized: false,
      },
      allowed_reviewer_decisions: [
        cacheSafeReplacementStatus,
        explicitExclusionStatus,
        needsAdditionalSourceStatus,
      ],
      review_status_values: reviewStatusValues,
      required_fields_for_cache_safe_replacement: requiredCacheSafeReplacementFields,
      required_fields_for_explicit_exclusion: requiredExplicitExclusionFields,
      preservation_contract: {
        stable_key: "review_key",
        canonical_metadata_source: clearerSourceReviewSubsetPath,
        preserved_fields: reviewOutcomeMutableFields,
        identity_fields_checked: [
          "split",
          "candidate_index",
          "source_cache",
          "source_row_index",
          "hand_key",
          "label_id",
          "clip_id",
          "video_frame_index",
        ],
        mismatched_existing_rows_are_reset_to_pending: true,
      },
      summary,
      validation,
      splits: {
        train: {
          summary: summarizeReviewOutcomeRows(trainRows),
          rows: trainRows,
        },
        test: {
          summary: summarizeReviewOutcomeRows(testRows),
          rows: testRows,
        },
      },
      decision:
        batchReviewFinished
          ? "The clearer-source review subset is batch-finished fail-closed: all 64 selected rows are explicit frame-edge/OOB exclusions, with 0 pending rows, 0 cache-safe replacements, and 0 cache rebuild authorizations. Further row deletion is not useful without crop-cache rebuild, landmark retrain, and held-out PCK re-measurement."
          : "This ledger is fail-closed and preserves reviewer decision fields by stable review_key. Cache-safe replacements or explicit exclusions affect counts only when their required provenance fields validate.",
      next_action:
        batchReviewFinished
          ? "rebuild_crop_cache_then_retrain_landmark_student_and_remeasure_pck_after_batch_review"
          : "fill_clearer_source_review_outcomes_with_replacements_or_exclusions_local_no_brev",
    };
  };
  const lookupReviewSourceVideo = (rawVideo) => {
    if (typeof rawVideo !== "string" || rawVideo.length === 0) {
      return {
        stored_path: rawVideo ?? null,
        exists_in_repo_checkout: false,
        exists_in_annotator_side_worktree: false,
        preferred_local_scope: null,
        preferred_local_path: null,
      };
    }
    const repoPath = path.join(root, rawVideo);
    const sidePath = path.join(sideRoot, rawVideo);
    const existsInRepo = exists(repoPath);
    const existsInSideWorktree = exists(sidePath);
    return {
      stored_path: rawVideo,
      exists_in_repo_checkout: existsInRepo,
      exists_in_annotator_side_worktree: existsInSideWorktree,
      preferred_local_scope: existsInRepo
        ? "repo_checkout"
        : existsInSideWorktree
          ? "annotator_side_worktree"
          : null,
      preferred_local_path: existsInRepo
        ? rawVideo
        : existsInSideWorktree
          ? path.relative(sideRoot, sidePath)
          : null,
    };
  };
  const reviewFrameWindow = (frameIndex) => {
    if (!Number.isFinite(frameIndex)) return [];
    return [-2, -1, 0, 1, 2]
      .map((offset) => frameIndex + offset)
      .filter((index) => index >= 0);
  };
  const reviewPacketRowsForSplit = (rows, split, limit) =>
    rows
      .filter((row) =>
        row.review_status === pendingReviewStatus
          && row.cache_safe_replacement === null
          && row.explicit_exclusion === null
          && row.cache_rebuild_allowed === false
      )
      .slice(0, limit)
      .map((row, index) => ({
        packet_row_index: index + 1,
        split,
        review_key: row.review_key,
        review_rank: row.review_rank,
        candidate_index: row.candidate_index,
        source_row_index: row.source_row_index,
        label_id: row.label_id,
        clip_id: row.clip_id,
        hand_key: row.hand_key,
        source_video: lookupReviewSourceVideo(row.raw_video),
        source_frame: {
          video_frame_index: row.video_frame_index,
          frame_indices_to_review: reviewFrameWindow(row.video_frame_index),
          frame_window_reason:
            "review center frame plus +/-2 neighboring frames before choosing replacement or exclusion",
        },
        teacher_box_full_frame: row.teacher_box_full_frame,
        edge_contact_count: row.edge_contact_count,
        review_priority_score: row.review_priority_score,
        current_ledger_status: {
          review_status: row.review_status,
          cache_safe_replacement: row.cache_safe_replacement,
          explicit_exclusion: row.explicit_exclusion,
          cache_rebuild_allowed: row.cache_rebuild_allowed,
        },
        allowed_reviewer_decisions: row.reviewer_decision_allowed_values,
      }));
  const buildClearerSourceReviewPacket = (reviewOutcomes, reviewOutcomesPath) => {
    if (!reviewOutcomes?.schema_version) return null;
    const perSplitLimit = 8;
    const trainRows = reviewPacketRowsForSplit(
      reviewOutcomes.splits?.train?.rows ?? [],
      "train",
      perSplitLimit,
    );
    const testRows = reviewPacketRowsForSplit(
      reviewOutcomes.splits?.test?.rows ?? [],
      "test",
      perSplitLimit,
    );
    const rows = [...trainRows, ...testRows];
    return {
      schema_version: "asl-pilot-m3jb-clearer-source-review-packet/v1",
      packet_id: "return-to-form-m3jb-clearer-source-review-packet-v1",
      generated_by: "scripts/audit_m3jb_hand_state_tracker.mjs",
      purpose:
        "Bound the first local visual/source-review batch for clearer-source landmark replacement or explicit exclusion decisions without embedding frames or authorizing cache rebuild.",
      source_outcome_ledger: {
        path: clearerSourceReviewOutcomesPath,
        sha256: reviewOutcomes
          ? sha256Text(`${JSON.stringify(reviewOutcomes, null, 2)}\n`)
          : (exists(reviewOutcomesPath) ? sha256(reviewOutcomesPath) : null),
      },
      runtime_boundary: {
        offline_review_metadata_only: true,
        browser_runtime_dependency_added: false,
        raw_learner_video_upload: false,
        raw_frames_embedded: false,
        landmark_cache_rebuild_authorized: false,
      },
      reviewer_protocol: {
        inspect_local_source_video_only: true,
        inspect_frame_window: "center frame plus +/-2 neighboring frames",
        allowed_decisions: reviewOutcomes.allowed_reviewer_decisions,
        cache_safe_replacement_requires:
          reviewOutcomes.required_fields_for_cache_safe_replacement,
        explicit_exclusion_requires:
          reviewOutcomes.required_fields_for_explicit_exclusion,
        default_if_unclear: needsAdditionalSourceStatus,
      },
      selection_policy: {
        source: "first pending rows from the fail-closed review outcome ledger",
        per_split_limit: perSplitLimit,
        split_order: ["train", "test"],
      },
      summary: {
        packet_rows: rows.length,
        train_rows: trainRows.length,
        test_rows: testRows.length,
        pending_ledger_rows_represented: countRows(
          rows,
          (row) => row.current_ledger_status.review_status === pendingReviewStatus,
        ),
        source_videos_available_local: countRows(
          rows,
          (row) =>
            row.source_video.exists_in_repo_checkout
              || row.source_video.exists_in_annotator_side_worktree,
        ),
        source_videos_missing_local: countRows(
          rows,
          (row) =>
            !row.source_video.exists_in_repo_checkout
              && !row.source_video.exists_in_annotator_side_worktree,
        ),
        cache_rebuild_allowed: 0,
        raw_frames_embedded: 0,
      },
      splits: {
        train: {
          summary: {
            rows: trainRows.length,
            source_videos_available_local: countRows(
              trainRows,
              (row) =>
                row.source_video.exists_in_repo_checkout
                  || row.source_video.exists_in_annotator_side_worktree,
            ),
          },
          rows: trainRows,
        },
        test: {
          summary: {
            rows: testRows.length,
            source_videos_available_local: countRows(
              testRows,
              (row) =>
                row.source_video.exists_in_repo_checkout
                  || row.source_video.exists_in_annotator_side_worktree,
            ),
          },
          rows: testRows,
        },
      },
      decision:
        rows.length === 0
          ? "The clearer-source reviewer work queue is empty because all selected rows now have fail-closed outcomes. This packet records no embedded frames and authorizes 0 cache rebuilds."
          : "This packet is a reviewer work queue only. It records 0 replacement labels, 0 explicit exclusions, and 0 cache-rebuild-authorized rows.",
      next_action:
        rows.length === 0
          ? "rebuild_crop_cache_then_retrain_landmark_student_and_remeasure_pck_after_batch_review"
          : "review_clearer_source_packet_rows_and_fill_outcomes_local_no_brev",
    };
  };
  const landmarkHeatmapEvidence = landmarkHeatmap010.schema_version
    ? {
        status: gateResult(metric(landmarkHeatmap010, ["test", "hand_pck"]), ">=", 0.9)
          && gateResult(metric(landmarkHeatmap005, ["test", "hand_pck"]), ">=", 0.75)
          ? "passed"
          : "failed_open_heatmap_candidate_below_landmark_gate",
        model_family: "scratch_heatmap_head_softargmax",
        trainer: rel(sideReceipts.landmarkHeatmapTrainerCode),
        runtime_promotion: false,
        browser_mapping_proven: false,
        receipts: {
          pck_010: rel(sideReceipts.landmarkHeatmapBestPck010),
          pck_005: rel(sideReceipts.landmarkHeatmapBestPck005),
        },
        metrics: {
          heatmap_grid: landmarkHeatmap010.heatmap_grid ?? null,
          width: landmarkHeatmap010.width ?? null,
          pck_010: round(metric(landmarkHeatmap010, ["test", "hand_pck"])),
          visible_pck_010: round(metric(landmarkHeatmap010, ["test", "visible_hand_pck"])),
          pck_005: round(metric(landmarkHeatmap005, ["test", "hand_pck"])),
          visible_pck_005: round(metric(landmarkHeatmap005, ["test", "visible_hand_pck"])),
          left_pck_010: round(metric(landmarkHeatmap010, ["test", "left_or_first_hand", "PCK"])),
          right_pck_010: round(metric(landmarkHeatmap010, ["test", "right_or_second_hand", "PCK"])),
          left_pck_005: round(metric(landmarkHeatmap005, ["test", "left_or_first_hand", "PCK"])),
          right_pck_005: round(metric(landmarkHeatmap005, ["test", "right_or_second_hand", "PCK"])),
          left_derived_box_iou: round(
            metric(landmarkHeatmap010, ["test", "left_or_first_hand", "derived_box_iou"]),
          ),
          right_derived_box_iou: round(
            metric(landmarkHeatmap010, ["test", "right_or_second_hand", "derived_box_iou"]),
          ),
        },
        gate: {
          pck_010_required: 0.9,
          pck_005_required: 0.75,
          pck_010_gap: round(0.9 - metric(landmarkHeatmap010, ["test", "hand_pck"])),
          pck_005_gap: round(0.75 - metric(landmarkHeatmap005, ["test", "hand_pck"])),
        },
        interpretation:
          "Heatmap/soft-argmax is the right scratch pose-estimation family to keep, but this candidate remains below the M3JB landmark gate and has not proven browser decoder coordinate mapping.",
      }
    : null;
  const landmarkHeatmapFilterDecision = landmarkHeatmapEvidence
    ? {
        status: "heatmap_head_is_valid_landmark_student_lane_but_not_gate_passing",
        user_question_answer:
          "Yes: use the scratch heatmap/soft-argmax landmark head as the per-hand landmark student route after the crop-cache rebuild. Do not treat this as a post-hoc image heatmap filter, and do not treat the existing heatmap checkpoint as solved.",
        model_family: landmarkHeatmapEvidence.model_family,
        best_recorded_metrics: landmarkHeatmapEvidence.metrics,
        gate: landmarkHeatmapEvidence.gate,
        current_gap: {
          pck_010_gap: landmarkHeatmapEvidence.gate.pck_010_gap,
          pck_005_gap: landmarkHeatmapEvidence.gate.pck_005_gap,
          browser_mapping_proven: landmarkHeatmapEvidence.browser_mapping_proven,
        },
        next_proof:
          "Rebuild the per-hand crop cache after the finished exclusion policy, retrain the scratch heatmap landmark student, then re-measure held-out PCK@0.10 and PCK@0.05 against the recorded baseline.",
        allowed_this_slice: {
          local_receipt_refresh: true,
          model_training_run: false,
          checkpoint_write: false,
          browser_export: false,
          brev_launch: false,
        },
        brev_launch_boundary:
          "Full landmark fitting is compute-bound and belongs on Brev. Current-thread approval is recorded for the bounded M3JB plan, but this executor turn records no launch because it only aligns the approval surfaces.",
        candidate_full_fit_shape: {
          cwd: "/Users/kelly/Developer/asl-pilot-annotator",
          crop_cache_rebuild_script:
            "tools/detector0-annotator/build_perhand_hires_cache.py",
          landmark_trainer:
            "tools/detector0-annotator/train_hands_landmarks_heatmap.py",
          recommended_head:
            "scratch heatmap logits with soft-argmax coordinate decode, visible/OOB masking hygiene, and PCK@0.10/PCK@0.05 eval receipts",
          no_pretrained_runtime_dependency: true,
          no_raw_learner_video_upload: true,
        },
      }
    : null;
  const landmarkCacheRebuildEval = landmarkCacheRebuildEvalReceipt.schema_version
    ? {
        path: landmarkCacheRebuildEvalReceiptPath,
        status: landmarkCacheRebuildEvalReceipt.status ?? null,
        source_policy: {
          outcome_ledger: landmarkCacheRebuildEvalReceipt.source_policy?.outcome_ledger ?? null,
          exclusion_adapter:
            landmarkCacheRebuildEvalReceipt.source_policy?.exclusion_adapter ?? null,
        },
        cache_rebuild: {
          workdir: landmarkCacheRebuildEvalReceipt.cache_rebuild?.workdir ?? null,
          cache_dir: landmarkCacheRebuildEvalReceipt.cache_rebuild?.cache_dir ?? null,
          summary: landmarkCacheRebuildEvalReceipt.cache_rebuild?.summary ?? null,
          artifacts: landmarkCacheRebuildEvalReceipt.cache_rebuild?.artifacts ?? null,
        },
        eval_only_measurement: {
          checkpoint: landmarkCacheRebuildEvalReceipt.eval_only_measurement?.checkpoint ?? null,
          rebuilt_cache: {
            pck_010_test:
              landmarkCacheRebuildEvalReceipt.eval_only_measurement?.rebuilt_cache?.pck_010?.test
              ?? null,
            pck_005_test:
              landmarkCacheRebuildEvalReceipt.eval_only_measurement?.rebuilt_cache?.pck_005?.test
              ?? null,
          },
          baseline: {
            pck_010_test:
              landmarkCacheRebuildEvalReceipt.eval_only_measurement?.baseline?.pck_010?.test
              ?? null,
            pck_005_test:
              landmarkCacheRebuildEvalReceipt.eval_only_measurement?.baseline?.pck_005?.test
              ?? null,
          },
          deltas: landmarkCacheRebuildEvalReceipt.eval_only_measurement?.deltas ?? null,
          gate_status:
            landmarkCacheRebuildEvalReceipt.eval_only_measurement?.gate_status ?? null,
        },
        runtime_boundary: landmarkCacheRebuildEvalReceipt.runtime_boundary ?? null,
        interpretation: landmarkCacheRebuildEvalReceipt.interpretation ?? null,
        claim_boundary: landmarkCacheRebuildEvalReceipt.claim_boundary ?? null,
        next_action: landmarkCacheRebuildEvalReceipt.next_action ?? null,
      }
    : null;
  const landmarkRetrainBrevPlan = landmarkRetrainBrevPlanReceipt.schema_version
    ? {
        path: landmarkRetrainBrevPlanReceiptPath,
        status: landmarkRetrainBrevPlanReceipt.status ?? null,
        approval_state: landmarkRetrainBrevPlanReceipt.approval_state ?? null,
        source_inputs: {
          rebuilt_cache_receipt:
            landmarkRetrainBrevPlanReceipt.source_inputs?.rebuilt_cache_receipt ?? null,
          rebuilt_cache: landmarkRetrainBrevPlanReceipt.source_inputs?.rebuilt_cache ?? null,
          cache_summary: landmarkRetrainBrevPlanReceipt.source_inputs?.cache_summary ?? null,
          baseline_metrics:
            landmarkRetrainBrevPlanReceipt.source_inputs?.baseline_metrics ?? null,
        },
        planned_remote: landmarkRetrainBrevPlanReceipt.planned_remote ?? null,
        training_plan: {
          scratch_train:
            landmarkRetrainBrevPlanReceipt.training_plan?.scratch_train ?? null,
          warm_start_or_init_weights:
            landmarkRetrainBrevPlanReceipt.training_plan?.warm_start_or_init_weights
            ?? null,
          max_train_rows_cap:
            landmarkRetrainBrevPlanReceipt.training_plan?.max_train_rows_cap ?? null,
          max_train_batches_cap:
            landmarkRetrainBrevPlanReceipt.training_plan?.max_train_batches_cap ?? null,
          output_receipt:
            landmarkRetrainBrevPlanReceipt.training_plan?.output_receipt ?? null,
          output_weights:
            landmarkRetrainBrevPlanReceipt.training_plan?.output_weights ?? null,
          expected_train_shape:
            landmarkRetrainBrevPlanReceipt.training_plan?.expected_train_shape ?? null,
        },
        evaluation_plan: {
          pck_010_receipt:
            landmarkRetrainBrevPlanReceipt.evaluation_plan?.pck_010_receipt ?? null,
          pck_005_receipt:
            landmarkRetrainBrevPlanReceipt.evaluation_plan?.pck_005_receipt ?? null,
          gate_decision_after_run:
            landmarkRetrainBrevPlanReceipt.evaluation_plan?.gate_decision_after_run ?? null,
        },
        actual_launch: landmarkRetrainBrevPlanReceipt.actual_launch ?? null,
        runtime_boundary: landmarkRetrainBrevPlanReceipt.runtime_boundary ?? null,
        claim_boundary: landmarkRetrainBrevPlanReceipt.claim_boundary ?? null,
        next_action: landmarkRetrainBrevPlanReceipt.next_action ?? null,
      }
    : null;
  const landmarkRetrainBrevRun = landmarkRetrainBrevRunReceipt.schema_version
    ? {
        path: landmarkRetrainBrevRunReceiptPath,
        status: landmarkRetrainBrevRunReceipt.status ?? null,
        approval_state: landmarkRetrainBrevRunReceipt.approval_state ?? null,
        worker: landmarkRetrainBrevRunReceipt.worker ?? null,
        sync_and_verification:
          landmarkRetrainBrevRunReceipt.sync_and_verification ?? null,
        training: {
          status: landmarkRetrainBrevRunReceipt.training?.status ?? null,
          command: landmarkRetrainBrevRunReceipt.training?.command ?? null,
          log: landmarkRetrainBrevRunReceipt.training?.log ?? null,
          best_epoch: landmarkRetrainBrevRunReceipt.training?.best_epoch ?? null,
          quality_filter:
            landmarkRetrainBrevRunReceipt.training?.quality_filter ?? null,
          output_receipt:
            landmarkRetrainBrevRunReceipt.training?.output_receipt ?? null,
          output_weights:
            landmarkRetrainBrevRunReceipt.training?.output_weights ?? null,
          training_receipt_test:
            landmarkRetrainBrevRunReceipt.training?.training_receipt_test
            ?? null,
        },
        evaluation: landmarkRetrainBrevRunReceipt.evaluation ?? null,
        metrics: landmarkRetrainBrevRunReceipt.metrics ?? null,
        copied_artifacts: landmarkRetrainBrevRunReceipt.copied_artifacts ?? null,
        runtime_boundary: landmarkRetrainBrevRunReceipt.runtime_boundary ?? null,
        claim_boundary: landmarkRetrainBrevRunReceipt.claim_boundary ?? null,
        next_action: landmarkRetrainBrevRunReceipt.next_action ?? null,
      }
    : null;
  const landmarkRetrainRegressionPivot =
    landmarkRetrainRegressionPivotReceipt.schema_version
      ? {
          path: landmarkRetrainRegressionPivotReceiptPath,
          status: landmarkRetrainRegressionPivotReceipt.status ?? null,
          inputs: landmarkRetrainRegressionPivotReceipt.inputs ?? null,
          regression_analysis:
            landmarkRetrainRegressionPivotReceipt.regression_analysis ?? null,
          pivot_decision:
            landmarkRetrainRegressionPivotReceipt.pivot_decision ?? null,
          next_action_scope:
            landmarkRetrainRegressionPivotReceipt.next_action_scope ?? null,
          runtime_boundary:
            landmarkRetrainRegressionPivotReceipt.runtime_boundary ?? null,
          claim_boundary:
            landmarkRetrainRegressionPivotReceipt.claim_boundary ?? null,
          next_action:
            landmarkRetrainRegressionPivotReceipt.next_action ?? null,
        }
      : null;
  const landmarkPckCampaignResearchPlan =
    landmarkPckCampaignResearchPlanReceipt.schema_version
      ? {
          path: landmarkPckCampaignResearchPlanReceiptPath,
          status: landmarkPckCampaignResearchPlanReceipt.status ?? null,
          research_escalation:
            landmarkPckCampaignResearchPlanReceipt.research_escalation ?? null,
          evidence_summary:
            landmarkPckCampaignResearchPlanReceipt.evidence_summary ?? null,
          research_guidance_summary:
            landmarkPckCampaignResearchPlanReceipt.research_guidance_summary
            ?? null,
          selected_first_run:
            landmarkPckCampaignResearchPlanReceipt.selected_first_run ?? null,
          prompt_alignment:
            landmarkPckCampaignResearchPlanReceipt.prompt_alignment ?? null,
          runtime_boundary:
            landmarkPckCampaignResearchPlanReceipt.runtime_boundary ?? null,
          claim_boundary:
            landmarkPckCampaignResearchPlanReceipt.claim_boundary ?? null,
          next_action:
            landmarkPckCampaignResearchPlanReceipt.next_action ?? null,
        }
      : null;
  const landmarkPckCampaignRun1Summary =
    landmarkPckCampaignRun1Receipt.schema_version
      ? {
          path: landmarkPckCampaignRun1ReceiptPath,
          status: landmarkPckCampaignRun1Receipt.status ?? null,
          worker: landmarkPckCampaignRun1Receipt.worker ?? null,
          trainer_support_patch:
            landmarkPckCampaignRun1Receipt.trainer_support_patch ?? null,
          experiment: {
            id: landmarkPckCampaignRun1Receipt.experiment?.id ?? null,
            hyperparameters:
              landmarkPckCampaignRun1Receipt.experiment?.hyperparameters ?? null,
            best_epoch:
              landmarkPckCampaignRun1Receipt.experiment?.best_epoch ?? null,
            best_validation:
              landmarkPckCampaignRun1Receipt.experiment?.best_validation ?? null,
            training_receipt_test:
              landmarkPckCampaignRun1Receipt.experiment?.training_receipt_test
              ?? null,
          },
          evaluation: landmarkPckCampaignRun1Receipt.evaluation ?? null,
          metrics: landmarkPckCampaignRun1Receipt.metrics ?? null,
          copied_artifacts: landmarkPckCampaignRun1Receipt.copied_artifacts ?? null,
          next_experiment_candidate:
            landmarkPckCampaignRun1Receipt.next_experiment_candidate ?? null,
          runtime_boundary:
            landmarkPckCampaignRun1Receipt.runtime_boundary ?? null,
          claim_boundary:
            landmarkPckCampaignRun1Receipt.claim_boundary ?? null,
          next_action: landmarkPckCampaignRun1Receipt.next_action ?? null,
        }
      : null;
  const landmarkPckCampaignRun2Summary =
    landmarkPckCampaignRun2Receipt.schema_version
      ? {
          path: landmarkPckCampaignRun2ReceiptPath,
          status: landmarkPckCampaignRun2Receipt.status ?? null,
          worker: landmarkPckCampaignRun2Receipt.worker ?? null,
          experiment: {
            id: landmarkPckCampaignRun2Receipt.experiment?.id ?? null,
            hyperparameters:
              landmarkPckCampaignRun2Receipt.experiment?.hyperparameters ?? null,
            best_epoch:
              landmarkPckCampaignRun2Receipt.experiment?.best_epoch ?? null,
            best_validation:
              landmarkPckCampaignRun2Receipt.experiment?.best_validation ?? null,
            training_receipt_test:
              landmarkPckCampaignRun2Receipt.experiment?.training_receipt_test
              ?? null,
          },
          evaluation: landmarkPckCampaignRun2Receipt.evaluation ?? null,
          metrics: landmarkPckCampaignRun2Receipt.metrics ?? null,
          copied_artifacts: landmarkPckCampaignRun2Receipt.copied_artifacts ?? null,
          next_experiment_candidate:
            landmarkPckCampaignRun2Receipt.next_experiment_candidate ?? null,
          runtime_boundary:
            landmarkPckCampaignRun2Receipt.runtime_boundary ?? null,
          claim_boundary:
            landmarkPckCampaignRun2Receipt.claim_boundary ?? null,
          next_action: landmarkPckCampaignRun2Receipt.next_action ?? null,
        }
      : null;
  const landmarkPckCampaignRun3Summary =
    landmarkPckCampaignRun3Receipt.schema_version
      ? {
          path: landmarkPckCampaignRun3ReceiptPath,
          status: landmarkPckCampaignRun3Receipt.status ?? null,
          worker: landmarkPckCampaignRun3Receipt.worker ?? null,
          experiment: {
            id: landmarkPckCampaignRun3Receipt.experiment?.id ?? null,
            hyperparameters:
              landmarkPckCampaignRun3Receipt.experiment?.hyperparameters ?? null,
            best_epoch:
              landmarkPckCampaignRun3Receipt.experiment?.best_epoch ?? null,
            best_validation:
              landmarkPckCampaignRun3Receipt.experiment?.best_validation ?? null,
            training_receipt_test:
              landmarkPckCampaignRun3Receipt.experiment?.training_receipt_test
              ?? null,
          },
          evaluation: landmarkPckCampaignRun3Receipt.evaluation ?? null,
          metrics: landmarkPckCampaignRun3Receipt.metrics ?? null,
          copied_artifacts: landmarkPckCampaignRun3Receipt.copied_artifacts ?? null,
          next_experiment_candidate:
            landmarkPckCampaignRun3Receipt.next_experiment_candidate ?? null,
          runtime_boundary:
            landmarkPckCampaignRun3Receipt.runtime_boundary ?? null,
          claim_boundary:
            landmarkPckCampaignRun3Receipt.claim_boundary ?? null,
          next_action: landmarkPckCampaignRun3Receipt.next_action ?? null,
        }
      : null;
  const landmarkPckResearchRefreshAfterRun3Summary =
    landmarkPckResearchRefreshAfterRun3Receipt.schema_version
      ? {
          path: landmarkPckResearchRefreshAfterRun3ReceiptPath,
          status: landmarkPckResearchRefreshAfterRun3Receipt.status ?? null,
          research_escalation:
            landmarkPckResearchRefreshAfterRun3Receipt.research_escalation ?? null,
          evidence_summary:
            landmarkPckResearchRefreshAfterRun3Receipt.evidence_summary ?? null,
          research_guidance_summary:
            landmarkPckResearchRefreshAfterRun3Receipt.research_guidance_summary ?? null,
          next_action_scope:
            landmarkPckResearchRefreshAfterRun3Receipt.next_action_scope ?? null,
          runtime_boundary:
            landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary ?? null,
          claim_boundary:
            landmarkPckResearchRefreshAfterRun3Receipt.claim_boundary ?? null,
          next_action: landmarkPckResearchRefreshAfterRun3Receipt.next_action ?? null,
        }
      : null;
  const landmarkPckResunetArchitecturePreflightSummary =
    landmarkPckResunetArchitecturePreflightReceipt.schema_version
      ? {
          path: landmarkPckResunetArchitecturePreflightReceiptPath,
          status: landmarkPckResunetArchitecturePreflightReceipt.status ?? null,
          side_worktree:
            landmarkPckResunetArchitecturePreflightReceipt.side_worktree ?? null,
          implementation:
            landmarkPckResunetArchitecturePreflightReceipt.implementation ?? null,
          local_smoke: landmarkPckResunetArchitecturePreflightReceipt.local_smoke
            ? {
                red_status:
                  landmarkPckResunetArchitecturePreflightReceipt.local_smoke
                    .red_status ?? null,
                syntax_status:
                  landmarkPckResunetArchitecturePreflightReceipt.local_smoke
                    .syntax_status ?? null,
                smoke_status:
                  landmarkPckResunetArchitecturePreflightReceipt.local_smoke
                    .smoke_status ?? null,
                smoke_sha256:
                  landmarkPckResunetArchitecturePreflightReceipt.local_smoke
                    .smoke_sha256 ?? null,
                smoke_payload:
                  landmarkPckResunetArchitecturePreflightReceipt.local_smoke
                    .smoke_payload ?? null,
              }
            : null,
          run4_envelope:
            landmarkPckResunetArchitecturePreflightReceipt.run4_envelope ?? null,
          runtime_boundary:
            landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary ?? null,
          claim_boundary:
            landmarkPckResunetArchitecturePreflightReceipt.claim_boundary ?? null,
          next_action: landmarkPckResunetArchitecturePreflightReceipt.next_action ?? null,
        }
      : null;
  const landmarkRetrainLocalPreflight = landmarkRetrainLocalPreflightReceipt.schema_version
    ? {
        path: landmarkRetrainLocalPreflightReceiptPath,
        status: landmarkRetrainLocalPreflightReceipt.status ?? null,
        approval_state: landmarkRetrainLocalPreflightReceipt.approval_state ?? null,
        local_preflight: {
          command: landmarkRetrainLocalPreflightReceipt.local_preflight?.command ?? null,
          status: landmarkRetrainLocalPreflightReceipt.local_preflight?.status ?? null,
          trainer: landmarkRetrainLocalPreflightReceipt.local_preflight?.trainer ?? null,
          helper_import:
            landmarkRetrainLocalPreflightReceipt.local_preflight?.helper_import ?? null,
          cache: landmarkRetrainLocalPreflightReceipt.local_preflight?.cache
            ? {
                path: landmarkRetrainLocalPreflightReceipt.local_preflight.cache.path ?? null,
                rows_json:
                  landmarkRetrainLocalPreflightReceipt.local_preflight.cache.rows_json ?? null,
                splits_json:
                  landmarkRetrainLocalPreflightReceipt.local_preflight.cache.splits_json ?? null,
                arrays:
                  landmarkRetrainLocalPreflightReceipt.local_preflight.cache.arrays ?? null,
              }
            : null,
          planned_outputs:
            landmarkRetrainLocalPreflightReceipt.local_preflight?.planned_outputs ?? null,
        },
        runtime_boundary: landmarkRetrainLocalPreflightReceipt.runtime_boundary ?? null,
        claim_boundary: landmarkRetrainLocalPreflightReceipt.claim_boundary ?? null,
        next_action: landmarkRetrainLocalPreflightReceipt.next_action ?? null,
      }
    : null;
  const brevReadinessRefresh = brevReadinessRefreshReceipt.schema_version
    ? {
        path: brevReadinessRefreshReceiptPath,
        status: brevReadinessRefreshReceipt.status ?? null,
        approval_state: brevReadinessRefreshReceipt.approval_state ?? null,
        plan_match: brevReadinessRefreshReceipt.plan_match ?? null,
        read_only_brev_visibility: {
          command:
            brevReadinessRefreshReceipt.read_only_brev_visibility?.command ?? null,
          status:
            brevReadinessRefreshReceipt.read_only_brev_visibility?.status ?? null,
          visibility_only:
            brevReadinessRefreshReceipt.read_only_brev_visibility
              ?.visibility_only ?? null,
          launch_or_lifecycle_action:
            brevReadinessRefreshReceipt.read_only_brev_visibility
              ?.launch_or_lifecycle_action ?? null,
          selected_worker:
            brevReadinessRefreshReceipt.read_only_brev_visibility
              ?.selected_worker ?? null,
          other_workers:
            brevReadinessRefreshReceipt.read_only_brev_visibility
              ?.other_workers ?? null,
          worker_readiness_for_approved_launch:
            brevReadinessRefreshReceipt.read_only_brev_visibility
              ?.worker_readiness_for_approved_launch ?? null,
        },
        actual_launch: brevReadinessRefreshReceipt.actual_launch ?? null,
        runtime_boundary: brevReadinessRefreshReceipt.runtime_boundary ?? null,
        claim_boundary: brevReadinessRefreshReceipt.claim_boundary ?? null,
        next_action: brevReadinessRefreshReceipt.next_action ?? null,
      }
    : null;
  const brevApprovalRequest = brevApprovalRequestReceipt.schema_version
    ? {
        path: brevApprovalRequestReceiptPath,
        status: brevApprovalRequestReceipt.status ?? null,
        approval_state: brevApprovalRequestReceipt.approval_state ?? null,
        approval_request: brevApprovalRequestReceipt.approval_request ?? null,
        authorization_envelope_if_approved:
          brevApprovalRequestReceipt.authorization_envelope_if_approved ?? null,
        prerequisites: brevApprovalRequestReceipt.prerequisites ?? null,
        actual_launch: brevApprovalRequestReceipt.actual_launch ?? null,
        runtime_boundary: brevApprovalRequestReceipt.runtime_boundary ?? null,
        claim_boundary: brevApprovalRequestReceipt.claim_boundary ?? null,
        next_action: brevApprovalRequestReceipt.next_action ?? null,
      }
    : null;
  const brevApprovalBlocker = brevApprovalBlockerReceipt.schema_version
    ? {
        path: brevApprovalBlockerReceiptPath,
        status: brevApprovalBlockerReceipt.status ?? null,
        repeated_blocker: brevApprovalBlockerReceipt.repeated_blocker ?? null,
        approval_state: brevApprovalBlockerReceipt.approval_state ?? null,
        actual_launch: brevApprovalBlockerReceipt.actual_launch ?? null,
        runtime_boundary: brevApprovalBlockerReceipt.runtime_boundary ?? null,
        claim_boundary: brevApprovalBlockerReceipt.claim_boundary ?? null,
        next_action: brevApprovalBlockerReceipt.next_action ?? null,
      }
    : null;
  const codexSupervisorDryRun = codexSupervisorDryRunReceipt.schema_version
    ? {
        path: codexSupervisorDryRunReceiptPath,
        status: codexSupervisorDryRunReceipt.status ?? null,
        pair_state_before: codexSupervisorDryRunReceipt.pair_state_before ?? null,
        tracker_state_before: codexSupervisorDryRunReceipt.tracker_state_before ?? null,
        dry_run: {
          command: codexSupervisorDryRunReceipt.dry_run?.command ?? null,
          status: codexSupervisorDryRunReceipt.dry_run?.status ?? null,
          output_sha256: codexSupervisorDryRunReceipt.dry_run?.output_sha256 ?? null,
          generated_supervisor_script:
            codexSupervisorDryRunReceipt.dry_run?.generated_supervisor_script ?? null,
        },
        actual_launch: codexSupervisorDryRunReceipt.actual_launch ?? null,
        runtime_boundary: codexSupervisorDryRunReceipt.runtime_boundary ?? null,
        claim_boundary: codexSupervisorDryRunReceipt.claim_boundary ?? null,
        next_action: codexSupervisorDryRunReceipt.next_action ?? null,
      }
    : null;
  const codexBothDryRun = codexBothDryRunReceipt.schema_version
    ? {
        path: codexBothDryRunReceiptPath,
        status: codexBothDryRunReceipt.status ?? null,
        pair_state_before: codexBothDryRunReceipt.pair_state_before ?? null,
        tracker_state_before: codexBothDryRunReceipt.tracker_state_before ?? null,
        dry_run: {
          command: codexBothDryRunReceipt.dry_run?.command ?? null,
          status: codexBothDryRunReceipt.dry_run?.status ?? null,
          output_sha256: codexBothDryRunReceipt.dry_run?.output_sha256 ?? null,
          generated_executor_script:
            codexBothDryRunReceipt.dry_run?.generated_executor_script ?? null,
          generated_observer_script:
            codexBothDryRunReceipt.dry_run?.generated_observer_script ?? null,
        },
        actual_launch: codexBothDryRunReceipt.actual_launch ?? null,
        runtime_boundary: codexBothDryRunReceipt.runtime_boundary ?? null,
        claim_boundary: codexBothDryRunReceipt.claim_boundary ?? null,
        next_action: codexBothDryRunReceipt.next_action ?? null,
      }
    : null;
  const landmarkCropQualityBottleneck = sourcePreservedCropQualityAudit.schema_version
    ? {
        status: "failed_open_edge_oob_crop_quality_bottleneck",
        receipt: rel(sideReceipts.sourcePreservedCropQualityAudit),
        groups: {
          all: summarizeQualityGroup(sourcePreservedCropQualityAudit, "all"),
          clean: summarizeQualityGroup(sourcePreservedCropQualityAudit, "clean"),
          edge: summarizeQualityGroup(sourcePreservedCropQualityAudit, "edge"),
          oob: summarizeQualityGroup(sourcePreservedCropQualityAudit, "oob"),
          high_error: summarizeQualityGroup(sourcePreservedCropQualityAudit, "high_error"),
          low_gradient: summarizeQualityGroup(sourcePreservedCropQualityAudit, "low_gradient"),
          small_area: summarizeQualityGroup(sourcePreservedCropQualityAudit, "small_area"),
        },
        interpretation:
          "Clean per-hand crops are much stronger than edge/OOB/high-error crops, so the next local landmark slice should target crop/relabel policy and browser coordinate mapping before spending on longer training.",
      }
    : null;
  const landmarkRelabelCandidateBacklog =
    sourcePreservedRelabelCandidatesTest.schema_version
      && sourcePreservedRelabelCandidatesTrain.schema_version
      ? {
          status: "ready_for_local_crop_rebuild_or_teacher_relabel_review",
          test_candidates: summarizeRelabelCandidates(
            sourcePreservedRelabelCandidatesTest,
            sideReceipts.sourcePreservedRelabelCandidatesTest,
          ),
          train_candidates: summarizeRelabelCandidates(
            sourcePreservedRelabelCandidatesTrain,
            sideReceipts.sourcePreservedRelabelCandidatesTrain,
          ),
          quality_test: landmarkCropQualityBottleneck
            ? {
                receipt: rel(sideReceipts.sourcePreservedCropQualityAudit),
                groups: landmarkCropQualityBottleneck.groups,
              }
            : null,
          quality_train: sourcePreservedCropQualityAuditTrain.schema_version
            ? {
                receipt: rel(sideReceipts.sourcePreservedCropQualityAuditTrain),
                groups: {
                  all: summarizeQualityGroup(sourcePreservedCropQualityAuditTrain, "all"),
                  clean: summarizeQualityGroup(sourcePreservedCropQualityAuditTrain, "clean"),
                  edge: summarizeQualityGroup(sourcePreservedCropQualityAuditTrain, "edge"),
                  oob: summarizeQualityGroup(sourcePreservedCropQualityAuditTrain, "oob"),
                  high_error: summarizeQualityGroup(sourcePreservedCropQualityAuditTrain, "high_error"),
                  low_gradient: summarizeQualityGroup(sourcePreservedCropQualityAuditTrain, "low_gradient"),
                  small_area: summarizeQualityGroup(sourcePreservedCropQualityAuditTrain, "small_area"),
                },
              }
            : null,
          recommended_first_action:
            sourcePreservedRelabelCandidatesTest.recommended_action_counts
              ?.rebuild_crop_with_more_context_or_mask_oob_keypoints
              > 0
              && sourcePreservedRelabelCandidatesTrain.recommended_action_counts
                ?.rebuild_crop_with_more_context_or_mask_oob_keypoints
                > 0
              ? "rebuild_crop_with_more_context_or_mask_oob_keypoints"
              : "manual_review_dominant_candidate_actions",
          runtime_promotion: false,
          brev_used: false,
          interpretation:
            "The heatmap head needs better per-hand crops/labels before longer training: the fixed source-preserved backlog is dominated by edge/OOB/high-error rows where the next local probe should rebuild crop context or mask out-of-bounds keypoints.",
        }
      : null;
  const landmarkOobMaskPolicyProbe = landmarkRelabelCandidateBacklog
    ? {
        status: "masking_helpful_but_insufficient_crop_rebuild_required",
        policy_tested:
          "Use visible/in-bounds keypoints as the scoring proxy for OOB rows before changing crops.",
        test_candidates: summarizeCandidateVisibilityPolicy(sourcePreservedRelabelCandidatesTest),
        train_candidates: summarizeCandidateVisibilityPolicy(sourcePreservedRelabelCandidatesTrain),
        quality_deltas: {
          test: {
            edge: summarizeQualityVisibilityDelta(sourcePreservedCropQualityAudit, "edge"),
            oob: summarizeQualityVisibilityDelta(sourcePreservedCropQualityAudit, "oob"),
            high_error: summarizeQualityVisibilityDelta(sourcePreservedCropQualityAudit, "high_error"),
            low_gradient: summarizeQualityVisibilityDelta(sourcePreservedCropQualityAudit, "low_gradient"),
          },
          train: {
            edge: summarizeQualityVisibilityDelta(sourcePreservedCropQualityAuditTrain, "edge"),
            oob: summarizeQualityVisibilityDelta(sourcePreservedCropQualityAuditTrain, "oob"),
            high_error: summarizeQualityVisibilityDelta(sourcePreservedCropQualityAuditTrain, "high_error"),
            low_gradient: summarizeQualityVisibilityDelta(sourcePreservedCropQualityAuditTrain, "low_gradient"),
          },
        },
        decision:
          "Visible/in-bounds masking improves OOB and edge aggregate PCK, but zero fixed backlog candidates reach visible_PCK@0.10 >= 0.90, so masking alone is not a gate path. Keep OOB masking as a loss/eval hygiene rule and prioritize rebuilding crops with more context.",
        recommended_next_action: "rebuild_crop_with_more_context_for_edge_oob_backlog_local_no_brev",
        runtime_promotion: false,
        brev_used: false,
      }
    : null;
  const landmarkCropContextGeometryProbe = landmarkOobMaskPolicyProbe
    ? {
        status: "source_crop_context_rebuild_ceiling_low_targeted_relabel_required",
        test_candidates: summarizeCropContextGeometry(sourcePreservedRelabelCandidatesTest),
        train_candidates: summarizeCropContextGeometry(sourcePreservedRelabelCandidatesTrain),
        decision:
          "The fixed backlog is mostly true frame-edge/source-crop-edge geometry. Default source-crop expansion resolves only a small fraction of teacher-edge rows, and the full-frame relabel-crop ceiling is nearly identical, so crop-context rebuild alone is not enough. The next local slice should run targeted offline relabel/clearer-frame review for the actual frame-edge backlog while keeping visibility masks as hygiene.",
        recommended_next_action:
          "targeted_offline_relabel_or_clearer_source_review_for_frame_edge_oob_backlog_local_no_brev",
        runtime_promotion: false,
        brev_used: false,
      }
    : null;
  const landmarkTargetedRelabelQueue = landmarkCropContextGeometryProbe
    ? {
        status: "ready_for_bounded_local_targeted_relabel_smoke",
        test_candidates: summarizeTargetedRelabelQueue(
          sourcePreservedRelabelCandidatesTest,
          sideReceipts.sourcePreservedRelabelCandidatesTest,
        ),
        train_candidates: summarizeTargetedRelabelQueue(
          sourcePreservedRelabelCandidatesTrain,
          sideReceipts.sourcePreservedRelabelCandidatesTrain,
        ),
        offline_relabel_tool: {
          script: rel(sideReceipts.targetedRelabelCandidatesScript),
          interpreter: exists(sideLabelPython) ? rel(sideLabelPython) : null,
          runtime_boundary:
            "Offline teacher/relabel tool only; no MediaPipe or generated labels enter browser runtime.",
        },
        bounded_smoke_plan: {
          candidate_prefix: 32,
          reason:
            "The top 32 train and test candidates in the fixed manifests are all frame-edge rows and all source videos are present, so a bounded local smoke can test whether rerunning the offline teacher on source frames recovers usable labels before larger relabel/cache/training work.",
          cwd: rel(sideRoot),
          commands: [
            `cd ${sideRoot} && .labelvenv/bin/python tools/detector0-annotator/targeted_relabel_candidates.py --candidates tools/detector0-annotator/output/m3ja-perhand-rows-sourcepreserved-c35-relabel-candidates-train-top1024.json --out tools/detector0-annotator/output/m3jb-frameedge-oob-targeted-relabel-train-top32 --max-candidates 32 --require-selected-hand --write-selected-only --min-selected-visible-frac 0.75 --max-selected-oob-points 0 --max-selected-center-dist 0.35`,
            `cd ${sideRoot} && .labelvenv/bin/python tools/detector0-annotator/targeted_relabel_candidates.py --candidates tools/detector0-annotator/output/m3ja-perhand-rows-sourcepreserved-c35-relabel-candidates-test-top512.json --out tools/detector0-annotator/output/m3jb-frameedge-oob-targeted-relabel-test-top32 --max-candidates 32 --require-selected-hand --write-selected-only --min-selected-visible-frac 0.75 --max-selected-oob-points 0 --max-selected-center-dist 0.35`,
          ],
        },
        decision:
          "The frame-edge OOB backlog is source-available and runnable locally. Run a bounded top-32 offline relabel smoke next, then decide whether to rebuild the per-hand cache from recovered labels, review clearer source frames, or exclude irrecoverable true-frame-edge rows.",
        recommended_next_action:
          "run_bounded_targeted_relabel_smoke_for_frame_edge_oob_backlog_local_no_brev",
        runtime_promotion: false,
        brev_used: false,
        training_run: false,
      }
    : null;
  const landmarkTargetedRelabelSmoke = landmarkTargetedRelabelQueue
    ? {
        status: "strict_acceptance_low_yield_not_cache_rebuild_ready",
        train_top32: summarizeTargetedRelabelSmoke(
          targetedRelabelTrainTop32Rows,
          sideReceipts.targetedRelabelTrainTop32Rows,
        ),
        test_top32_diagnostic: summarizeTargetedRelabelSmoke(
          targetedRelabelTestTop32Rows,
          sideReceipts.targetedRelabelTestTop32Rows,
        ),
        command_correction:
          "The source_cache paths in the candidate manifests are relative to the asl-pilot-annotator worktree root, so the smoke commands must run from /Users/kelly/Developer/asl-pilot-annotator, not from tools/detector0-annotator.",
        decision:
          "The bounded offline teacher smoke proves source availability but does not justify a cache rebuild under strict acceptance: train writes 1/32 and diagnostic test writes 0/32, with most selected detections rejected by visible-fraction/OOB filters. Next inspect acceptance thresholds and clearer-source/frame-edge policy before longer landmark heatmap training.",
        recommended_next_action:
          "review_targeted_relabel_acceptance_or_clearer_source_policy_after_low_yield_top32_smoke_local_no_brev",
        runtime_promotion: false,
        brev_used: false,
        training_run: false,
      }
    : null;
  const landmarkTargetedRelabelAcceptanceDiagnostic = landmarkTargetedRelabelSmoke
    ? {
        status: "selected_only_quality_distribution_confirms_true_frame_edge_policy_needed",
        policy_tested:
          "Run the same top-32 source-frame relabel smoke with only require_selected_hand/write_selected_only, leaving visible-fraction and OOB thresholds open so selected relabel quality can be inspected.",
        train_top32_selected_only: summarizeSelectedOnlyRelabelDiagnostic(
          targetedRelabelTrainTop32SelectedOnlyRows,
          sideReceipts.targetedRelabelTrainTop32SelectedOnlyRows,
        ),
        test_top32_selected_only: summarizeSelectedOnlyRelabelDiagnostic(
          targetedRelabelTestTop32SelectedOnlyRows,
          sideReceipts.targetedRelabelTestTop32SelectedOnlyRows,
        ),
        decision:
          "Selected-only recovery confirms the offline teacher often selects the intended hand, but most selected labels remain mostly out of frame. Train selected-only writes 22/32, but median visible fraction is 0.190476 with median 17 OOB points; diagnostic test writes 30/32, but max visible fraction is only 0.619048 and zero rows pass visible>=0.50 with <=4 OOB points. Simple acceptance relaxation is not a safe cache-rebuild path.",
        recommended_next_action:
          "decide_true_frame_edge_exclusion_or_clearer_source_policy_before_landmark_cache_rebuild_local_no_brev",
        runtime_promotion: false,
        brev_used: false,
        training_run: false,
      }
    : null;
  const landmarkFrameEdgeCachePolicyDecision = landmarkTargetedRelabelAcceptanceDiagnostic
    ? summarizeFrameEdgePolicyDecision(
        targetedRelabelTrainTop32SelectedOnlyRows,
        sideReceipts.targetedRelabelTrainTop32SelectedOnlyRows,
        targetedRelabelTestTop32SelectedOnlyRows,
        sideReceipts.targetedRelabelTestTop32SelectedOnlyRows,
        landmarkTargetedRelabelQueue,
      )
    : null;
  const landmarkFrameEdgeDispositionManifest = buildFrameEdgeDispositionManifest(
    sourcePreservedRelabelCandidatesTrain,
    sideReceipts.sourcePreservedRelabelCandidatesTrain,
    sourcePreservedRelabelCandidatesTest,
    sideReceipts.sourcePreservedRelabelCandidatesTest,
    targetedRelabelTrainTop32SelectedOnlyRows,
    sideReceipts.targetedRelabelTrainTop32SelectedOnlyRows,
    targetedRelabelTestTop32SelectedOnlyRows,
    sideReceipts.targetedRelabelTestTop32SelectedOnlyRows,
    landmarkFrameEdgeCachePolicyDecision,
  );
  const landmarkFrameEdgeExclusionSeed = buildFrameEdgeExclusionSeed(
    landmarkFrameEdgeDispositionManifest,
    frameEdgeDispositionManifestFilePath,
  );
  const landmarkClearerSourceReviewSubset = buildClearerSourceReviewSubset(
    landmarkFrameEdgeDispositionManifest,
    frameEdgeDispositionManifestFilePath,
    frameEdgeExclusionSeedFilePath,
  );
  const existingClearerSourceReviewOutcomes = exists(clearerSourceReviewOutcomesFilePath)
    ? readJson(clearerSourceReviewOutcomesFilePath)
    : null;
  const landmarkClearerSourceReviewOutcomes = buildClearerSourceReviewOutcomes(
    landmarkClearerSourceReviewSubset,
    clearerSourceReviewSubsetFilePath,
    existingClearerSourceReviewOutcomes,
  );
  const landmarkClearerSourceReviewPacket = buildClearerSourceReviewPacket(
    landmarkClearerSourceReviewOutcomes,
    clearerSourceReviewOutcomesFilePath,
  );
  addCheck(
    checks,
    blockers,
    "landmark_heatmap_candidate_recorded_below_gate",
    landmarkHeatmapEvidence?.status === "failed_open_heatmap_candidate_below_landmark_gate"
      && landmarkHeatmapEvidence.metrics.pck_010 === 0.801
      && landmarkHeatmapEvidence.metrics.pck_005 === 0.4656,
    {
      pck_010: landmarkHeatmapEvidence?.metrics?.pck_010 ?? null,
      pck_005: landmarkHeatmapEvidence?.metrics?.pck_005 ?? null,
      visible_pck_010: landmarkHeatmapEvidence?.metrics?.visible_pck_010 ?? null,
      visible_pck_005: landmarkHeatmapEvidence?.metrics?.visible_pck_005 ?? null,
      status: landmarkHeatmapEvidence?.status ?? null,
    },
    "landmark heatmap evidence must be recorded as below the M3JB landmark gate",
  );
  addCheck(
    checks,
    blockers,
    "landmark_heatmap_filter_decision_recorded",
    landmarkHeatmapFilterDecision?.status
      === "heatmap_head_is_valid_landmark_student_lane_but_not_gate_passing"
      && landmarkHeatmapFilterDecision.best_recorded_metrics?.pck_010 === 0.801
      && landmarkHeatmapFilterDecision.best_recorded_metrics?.pck_005 === 0.4656
      && landmarkHeatmapFilterDecision.allowed_this_slice?.model_training_run === false
      && landmarkHeatmapFilterDecision.allowed_this_slice?.brev_launch === false,
    {
      status: landmarkHeatmapFilterDecision?.status ?? null,
      pck_010: landmarkHeatmapFilterDecision?.best_recorded_metrics?.pck_010 ?? null,
      pck_005: landmarkHeatmapFilterDecision?.best_recorded_metrics?.pck_005 ?? null,
      answer: landmarkHeatmapFilterDecision?.user_question_answer ?? null,
      model_training_run:
        landmarkHeatmapFilterDecision?.allowed_this_slice?.model_training_run ?? null,
      brev_launch: landmarkHeatmapFilterDecision?.allowed_this_slice?.brev_launch ?? null,
    },
    "landmark heatmap decision must answer the heatmap-filter question without claiming gate passage or launching Brev",
  );
  addCheck(
    checks,
    blockers,
    "landmark_cache_rebuild_eval_records_rebuilt_cache_and_pck_deltas",
    landmarkCacheRebuildEvalReceipt.schema_version
      === "asl-pilot-m3jb-landmark-cache-rebuild-eval/v1"
      && landmarkCacheRebuildEvalReceipt.status === "passed_eval_only_not_gate_passing"
      && landmarkCacheRebuildEvalReceipt.runtime_boundary?.brev_used === false
      && landmarkCacheRebuildEvalReceipt.runtime_boundary?.training_run === false
      && landmarkCacheRebuildEvalReceipt.cache_rebuild?.summary?.excluded_source_hands === 64
      && landmarkCacheRebuildEvalReceipt.cache_rebuild?.summary?.rows_after === 30120
      && landmarkCacheRebuildEvalReceipt.eval_only_measurement?.deltas?.test_pck_010 > 0
      && landmarkCacheRebuildEvalReceipt.eval_only_measurement?.deltas?.test_pck_005 > 0,
    {
      path: landmarkCacheRebuildEvalReceiptPath,
      status: landmarkCacheRebuildEvalReceipt.status ?? null,
      rows_after:
        landmarkCacheRebuildEvalReceipt.cache_rebuild?.summary?.rows_after ?? null,
      excluded_source_hands:
        landmarkCacheRebuildEvalReceipt.cache_rebuild?.summary?.excluded_source_hands ?? null,
      test_pck_010:
        landmarkCacheRebuildEvalReceipt.eval_only_measurement?.rebuilt_cache?.pck_010
          ?.test?.PCK ?? null,
      test_pck_005:
        landmarkCacheRebuildEvalReceipt.eval_only_measurement?.rebuilt_cache?.pck_005
          ?.test?.PCK ?? null,
      deltas: landmarkCacheRebuildEvalReceipt.eval_only_measurement?.deltas ?? null,
      brev_used: landmarkCacheRebuildEvalReceipt.runtime_boundary?.brev_used ?? null,
      training_run: landmarkCacheRebuildEvalReceipt.runtime_boundary?.training_run ?? null,
    },
    "landmark cache-rebuild eval receipt must prove the rebuilt cache, eval-only PCK deltas, and no Brev/training boundary",
  );
  addCheck(
    checks,
    blockers,
    "landmark_retrain_brev_plan_completed_rejected_scratch_full_cache_route",
    landmarkRetrainBrevPlanReceipt.schema_version
      === "asl-pilot-m3jb-landmark-retrain-brev-plan/v1"
      && landmarkRetrainBrevPlanReceipt.status
        === "completed_rejected_below_baseline_and_gate"
      && landmarkRetrainBrevPlanReceipt.approval_state
        ?.active_prompt_authorizes_brev_for_compute_bound_landmark_fit === true
      && landmarkRetrainBrevPlanReceipt.approval_state
        ?.current_thread_explicit_brev_spend_approval === true
      && landmarkRetrainBrevPlanReceipt.approval_state?.effective_launch_allowed_now
        === false
      && landmarkRetrainBrevPlanReceipt.approval_state?.approval_consumed_by_run
        === true
      && landmarkRetrainBrevPlanReceipt.approval_state?.consumed_run_receipt
        === landmarkRetrainBrevRunReceiptPath
      && landmarkRetrainBrevPlanReceipt.approval_state
        ?.approval_recorded_by_this_receipt === true
      && landmarkRetrainBrevPlanReceipt.approval_state?.approval_record
        ?.exact_approval_text === landmarkRetrainApprovalText
      && landmarkRetrainBrevPlanReceipt.approval_state?.approval_record
        ?.approved_worker === "asl-pilot-m3eh-l40s-001"
      && landmarkRetrainBrevPlanReceipt.approval_state?.approval_record
        ?.approved_worker_id === "3d58wpy9o"
      && landmarkRetrainBrevPlanReceipt.approval_state?.approval_record
        ?.max_spend_usd === 40
      && landmarkRetrainBrevPlanReceipt.approval_state?.approval_record
        ?.max_outer_runtime_seconds === 21600
      && landmarkRetrainBrevPlanReceipt.approval_alignment?.status
        === "current_thread_approval_recorded_no_launch"
      && landmarkRetrainBrevPlanReceipt.runtime_boundary
        ?.read_only_brev_visibility_only === true
      && landmarkRetrainBrevPlanReceipt.runtime_boundary?.brev_used === false
      && landmarkRetrainBrevPlanReceipt.runtime_boundary?.training_run === false
      && landmarkRetrainBrevPlanReceipt.runtime_boundary?.checkpoint_written === false
      && landmarkRetrainBrevPlanReceipt.training_plan?.scratch_train === true
      && landmarkRetrainBrevPlanReceipt.training_plan?.warm_start_or_init_weights
        === false
      && landmarkRetrainBrevPlanReceipt.training_plan?.max_train_rows_cap === null
      && landmarkRetrainBrevPlanReceipt.training_plan?.max_train_batches_cap === null
      && landmarkRetrainBrevPlanReceipt.source_inputs?.cache_summary?.rows_after
        === 30120
      && landmarkRetrainBrevPlanReceipt.source_inputs?.cache_summary
        ?.excluded_source_hands === 64
      && landmarkRetrainBrevPlanReceipt.training_plan?.command?.includes(
        "train_perhand_landmarks_heatmap.py",
      )
      && landmarkRetrainBrevPlanReceipt.training_plan?.command?.includes(
        "--data tools/detector0-annotator/.cache/m3jb-perhand-rows-ledger-excluded-c35-v1",
      )
      && landmarkRetrainBrevPlanReceipt.training_plan?.command?.includes(
        "--device cuda",
      )
      && !landmarkRetrainBrevPlanReceipt.training_plan?.command?.includes(
        "--init-weights",
      )
      && !landmarkRetrainBrevPlanReceipt.training_plan?.command?.includes(
        "--max-train-batches",
      )
      && landmarkRetrainBrevPlanReceipt.evaluation_plan?.commands?.some(
        (command) => command.metric === "PCK@0.10",
      )
      && landmarkRetrainBrevPlanReceipt.evaluation_plan?.commands?.some(
        (command) => command.metric === "PCK@0.05",
      )
      && landmarkRetrainBrevPlanReceipt.planned_remote?.max_spend_usd > 0
      && landmarkRetrainBrevPlanReceipt.actual_launch?.status
        === "completed_rejected_below_baseline_and_gate"
      && landmarkRetrainBrevPlanReceipt.actual_launch?.run_receipt
        === landmarkRetrainBrevRunReceiptPath
      && landmarkRetrainBrevPlanReceipt.actual_launch?.metrics?.eval_pck_010
        === 0.6484
      && landmarkRetrainBrevPlanReceipt.actual_launch?.metrics?.eval_pck_005
        === 0.3651
      && landmarkRetrainBrevPlanReceipt.actual_launch?.metrics?.decision
        === "rejected_fail_closed_below_rebuilt_cache_baseline_and_gate"
      && landmarkRetrainBrevPlanReceipt.actual_launch?.worker_teardown
        ?.final_status === "STOPPED"
      && landmarkRetrainBrevPlanReceipt.next_action
        === landmarkRetrainRegressionPivotNextAction,
    {
      path: landmarkRetrainBrevPlanReceiptPath,
      status: landmarkRetrainBrevPlanReceipt.status ?? null,
      effective_launch_allowed_now:
        landmarkRetrainBrevPlanReceipt.approval_state?.effective_launch_allowed_now
        ?? null,
      rows_after:
        landmarkRetrainBrevPlanReceipt.source_inputs?.cache_summary?.rows_after
        ?? null,
      scratch_train:
        landmarkRetrainBrevPlanReceipt.training_plan?.scratch_train ?? null,
      max_train_rows_cap:
        landmarkRetrainBrevPlanReceipt.training_plan?.max_train_rows_cap ?? null,
      max_train_batches_cap:
        landmarkRetrainBrevPlanReceipt.training_plan?.max_train_batches_cap
        ?? null,
      max_spend_usd:
        landmarkRetrainBrevPlanReceipt.planned_remote?.max_spend_usd ?? null,
      actual_launch: landmarkRetrainBrevPlanReceipt.actual_launch ?? null,
      next_action: landmarkRetrainBrevPlanReceipt.next_action ?? null,
    },
    "landmark retrain Brev plan must be completed once, consumed, rejected fail-closed below baseline/gate, and route to local pivot analysis",
  );
  addCheck(
    checks,
    blockers,
    "landmark_retrain_brev_run_completed_rejected_and_stopped",
    landmarkRetrainBrevRunReceipt.schema_version
      === "asl-pilot-m3jb-landmark-retrain-brev-run/v1"
      && landmarkRetrainBrevRunReceipt.status
        === "completed_rejected_below_baseline_and_gate"
      && landmarkRetrainBrevRunReceipt.approval_state
        ?.current_thread_explicit_brev_spend_approval === true
      && landmarkRetrainBrevRunReceipt.approval_state
        ?.approval_consumed_by_this_run === true
      && landmarkRetrainBrevRunReceipt.approval_state?.effective_launch_allowed_now
        === false
      && landmarkRetrainBrevRunReceipt.approval_state?.consumed_envelope
        ?.plan_receipt === landmarkRetrainBrevPlanReceiptPath
      && landmarkRetrainBrevRunReceipt.approval_state?.consumed_envelope
        ?.preferred_instance === "asl-pilot-m3eh-l40s-001"
      && landmarkRetrainBrevRunReceipt.approval_state?.consumed_envelope
        ?.preferred_instance_id === "3d58wpy9o"
      && landmarkRetrainBrevRunReceipt.approval_state?.consumed_envelope
        ?.max_spend_usd === 40
      && landmarkRetrainBrevRunReceipt.approval_state?.consumed_envelope
        ?.max_runtime_seconds?.outer_timeout === 21600
      && landmarkRetrainBrevRunReceipt.worker?.preflight?.status === "passed"
      && landmarkRetrainBrevRunReceipt.worker?.preflight?.cuda_available === true
      && landmarkRetrainBrevRunReceipt.worker?.preflight
        ?.active_training_process_found === false
      && landmarkRetrainBrevRunReceipt.sync_and_verification?.status === "passed"
      && landmarkRetrainBrevRunReceipt.sync_and_verification?.trainer_sha256
        === landmarkRetrainBrevPlanReceipt.source_inputs?.trainer_sha256
      && landmarkRetrainBrevRunReceipt.sync_and_verification?.rows_json_sha256
        === landmarkRetrainBrevPlanReceipt.source_inputs?.cache_artifacts
          ?.rows_json?.sha256
      && landmarkRetrainBrevRunReceipt.sync_and_verification?.splits_json_sha256
        === landmarkRetrainBrevPlanReceipt.source_inputs?.cache_artifacts
          ?.splits_json?.sha256
      && landmarkRetrainBrevRunReceipt.sync_and_verification
        ?.remote_cache_shapes?.rows_count === 30120
      && landmarkRetrainBrevRunReceipt.sync_and_verification
        ?.remote_cache_shapes?.splits_rows === 30120
      && landmarkRetrainBrevRunReceipt.training?.status === "passed"
      && landmarkRetrainBrevRunReceipt.training?.command
        === landmarkRetrainBrevPlanReceipt.training_plan?.command
      && landmarkRetrainBrevRunReceipt.training?.best_epoch === 75
      && landmarkRetrainBrevRunReceipt.training?.quality_filter?.after === 15649
      && landmarkRetrainBrevRunReceipt.training?.training_receipt_test?.PCK
        === 0.6484
      && landmarkRetrainBrevRunReceipt.evaluation?.status === "passed"
      && landmarkRetrainBrevRunReceipt.evaluation?.pck_010?.test?.PCK
        === 0.6484
      && landmarkRetrainBrevRunReceipt.evaluation?.pck_005?.test?.PCK
        === 0.3651
      && landmarkRetrainBrevRunReceipt.metrics?.baseline_rebuilt_cache_pck_010
        === 0.6633
      && landmarkRetrainBrevRunReceipt.metrics?.baseline_rebuilt_cache_pck_005
        === 0.3722
      && landmarkRetrainBrevRunReceipt.metrics?.delta_vs_baseline_pck_010 < 0
      && landmarkRetrainBrevRunReceipt.metrics?.delta_vs_baseline_pck_005 < 0
      && landmarkRetrainBrevRunReceipt.metrics?.gate_pck_010 === 0.9
      && landmarkRetrainBrevRunReceipt.metrics?.gate_pck_005 === 0.75
      && landmarkRetrainBrevRunReceipt.metrics?.decision
        === "rejected_fail_closed_below_rebuilt_cache_baseline_and_gate"
      && Object.values(landmarkRetrainBrevRunReceipt.copied_artifacts ?? {})
        .filter((artifact) => artifact && typeof artifact === "object" && "copied_back" in artifact)
        .every((artifact) => artifact.copied_back === true)
      && landmarkRetrainBrevRunReceipt.worker?.teardown?.stop_command_status
        === "passed"
      && landmarkRetrainBrevRunReceipt.worker?.teardown?.final_status
        === "STOPPED"
      && landmarkRetrainBrevRunReceipt.runtime_boundary?.brev_exec_or_copy
        === true
      && landmarkRetrainBrevRunReceipt.runtime_boundary?.training_run === true
      && landmarkRetrainBrevRunReceipt.runtime_boundary?.eval_only_pck_run
        === true
      && landmarkRetrainBrevRunReceipt.runtime_boundary?.checkpoint_written
        === true
      && landmarkRetrainBrevRunReceipt.runtime_boundary?.worker_stopped_after_run
        === true
      && landmarkRetrainBrevRunReceipt.runtime_boundary?.browser_artifact_promoted
        === false
      && landmarkRetrainBrevRunReceipt.runtime_boundary?.raw_learner_video_upload
        === false
      && landmarkRetrainBrevRunReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && landmarkRetrainBrevRunReceipt.runtime_boundary?.final_gate_changed === false
      && landmarkRetrainBrevRunReceipt.next_action
        === landmarkRetrainRegressionPivotNextAction,
    {
      path: landmarkRetrainBrevRunReceiptPath,
      status: landmarkRetrainBrevRunReceipt.status ?? null,
      approval_consumed_by_this_run:
        landmarkRetrainBrevRunReceipt.approval_state
          ?.approval_consumed_by_this_run ?? null,
      worker: landmarkRetrainBrevRunReceipt.worker ?? null,
      remote_cache_shapes:
        landmarkRetrainBrevRunReceipt.sync_and_verification
          ?.remote_cache_shapes ?? null,
      metrics: landmarkRetrainBrevRunReceipt.metrics ?? null,
      runtime_boundary: landmarkRetrainBrevRunReceipt.runtime_boundary ?? null,
      next_action: landmarkRetrainBrevRunReceipt.next_action ?? null,
    },
    "landmark retrain Brev run receipt must prove the approved run completed once, regressed below baseline/gates, copied artifacts back, stopped the worker, and stayed fail-closed",
  );
  addCheck(
    checks,
    blockers,
    "landmark_retrain_regression_pivot_selects_resolution_capacity_no_brev",
    landmarkRetrainRegressionPivotReceipt.schema_version
      === "asl-pilot-m3jb-landmark-retrain-regression-pivot/v1"
      && landmarkRetrainRegressionPivotReceipt.status
        === "completed_pivot_selected_no_brev"
      && landmarkRetrainRegressionPivotReceipt.source_of_truth
        ?.cache_rebuild_eval_receipt === landmarkCacheRebuildEvalReceiptPath
      && landmarkRetrainRegressionPivotReceipt.source_of_truth
        ?.approved_retrain_run_receipt === landmarkRetrainBrevRunReceiptPath
      && landmarkRetrainRegressionPivotReceipt.inputs?.rebuilt_cache?.rows_after
        === 30120
      && landmarkRetrainRegressionPivotReceipt.inputs
        ?.baseline_existing_checkpoint_on_rebuilt_cache?.test_pck_010 === 0.6633
      && landmarkRetrainRegressionPivotReceipt.inputs
        ?.baseline_existing_checkpoint_on_rebuilt_cache?.test_pck_005 === 0.3722
      && landmarkRetrainRegressionPivotReceipt.inputs?.approved_scratch_retrain
        ?.test_pck_010 === 0.6484
      && landmarkRetrainRegressionPivotReceipt.inputs?.approved_scratch_retrain
        ?.test_pck_005 === 0.3651
      && landmarkRetrainRegressionPivotReceipt.inputs?.approved_scratch_retrain
        ?.quality_filter?.removed === 6553
      && landmarkRetrainRegressionPivotReceipt.inputs?.approved_scratch_retrain
        ?.quality_filter?.removed_fraction > 0.29
      && landmarkRetrainRegressionPivotReceipt.regression_analysis
        ?.same_rebuilt_cache_eval_split === true
      && landmarkRetrainRegressionPivotReceipt.regression_analysis
        ?.metric_deltas_vs_rebuilt_cache_baseline?.test_pck_010 < 0
      && landmarkRetrainRegressionPivotReceipt.regression_analysis
        ?.metric_deltas_vs_rebuilt_cache_baseline?.test_pck_005 < 0
      && landmarkRetrainRegressionPivotReceipt.regression_analysis
        ?.metric_deltas_vs_rebuilt_cache_baseline?.validation_pck_010 < -0.06
      && landmarkRetrainRegressionPivotReceipt.regression_analysis
        ?.per_keypoint_summary?.pck_010_improved_keypoints === 2
      && landmarkRetrainRegressionPivotReceipt.pivot_decision?.selected_lever
        === "higher_input_resolution_and_capacity_preflight"
      && landmarkRetrainRegressionPivotReceipt.pivot_decision
        ?.selected_next_action === landmarkResolutionCapacityPreflightNextAction
      && Array.isArray(
        landmarkRetrainRegressionPivotReceipt.pivot_decision
          ?.rejected_next_steps,
      )
      && landmarkRetrainRegressionPivotReceipt.pivot_decision.rejected_next_steps
        .some((step) => step.action === "relaunch_same_approved_brev_envelope")
      && landmarkRetrainRegressionPivotReceipt.pivot_decision.rejected_next_steps
        .some((step) => step.action === "delete_more_frame_edge_rows")
      && landmarkRetrainRegressionPivotReceipt.pivot_decision.rejected_next_steps
        .some((step) => step.action === "browser_promotion")
      && landmarkRetrainRegressionPivotReceipt.pivot_decision.rejected_next_steps
        .some((step) => step.action === "final_gate_change")
      && landmarkRetrainRegressionPivotReceipt.runtime_boundary?.local_only
        === true
      && landmarkRetrainRegressionPivotReceipt.runtime_boundary?.brev_used
        === false
      && landmarkRetrainRegressionPivotReceipt.runtime_boundary?.training_run
        === false
      && landmarkRetrainRegressionPivotReceipt.runtime_boundary
        ?.optimizer_or_backward === false
      && landmarkRetrainRegressionPivotReceipt.runtime_boundary
        ?.checkpoint_written === false
      && landmarkRetrainRegressionPivotReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && landmarkRetrainRegressionPivotReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && landmarkRetrainRegressionPivotReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && landmarkRetrainRegressionPivotReceipt.runtime_boundary
        ?.final_gate_changed === false
      && landmarkRetrainRegressionPivotReceipt.next_action
        === landmarkResolutionCapacityPreflightNextAction,
    {
      path: landmarkRetrainRegressionPivotReceiptPath,
      status: landmarkRetrainRegressionPivotReceipt.status ?? null,
      deltas:
        landmarkRetrainRegressionPivotReceipt.regression_analysis
          ?.metric_deltas_vs_rebuilt_cache_baseline ?? null,
      selected_lever:
        landmarkRetrainRegressionPivotReceipt.pivot_decision?.selected_lever
        ?? null,
      rejected_next_steps:
        landmarkRetrainRegressionPivotReceipt.pivot_decision
          ?.rejected_next_steps ?? null,
      runtime_boundary:
        landmarkRetrainRegressionPivotReceipt.runtime_boundary ?? null,
      next_action: landmarkRetrainRegressionPivotReceipt.next_action ?? null,
    },
    "landmark retrain regression pivot must record the below-baseline comparison, reject same-envelope relaunch and more row deletion, and select local resolution/capacity preflight without Brev or training",
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_campaign_research_plan_selects_run1_w96_g48_fulltrain",
    landmarkPckCampaignResearchPlanReceipt.schema_version
      === "asl-pilot-m3jb-landmark-pck-campaign-research-plan/v1"
      && landmarkPckCampaignResearchPlanReceipt.status
        === "completed_research_plan_no_brev_no_training"
      && landmarkPckCampaignResearchPlanReceipt.source_of_truth
        ?.regression_pivot_receipt === landmarkRetrainRegressionPivotReceiptPath
      && landmarkPckCampaignResearchPlanReceipt.research_escalation
        ?.required_by_goal === true
      && landmarkPckCampaignResearchPlanReceipt.research_escalation
        ?.gpt_pro_web_attempt?.attempted === true
      && landmarkPckCampaignResearchPlanReceipt.research_escalation
        ?.gpt_pro_web_attempt?.status === "blocked_browser_iab_unavailable"
      && landmarkPckCampaignResearchPlanReceipt.research_escalation
        ?.fallback?.used === true
      && landmarkPckCampaignResearchPlanReceipt.research_escalation
        ?.fallback?.route === "openai-api-research"
      && String(
        landmarkPckCampaignResearchPlanReceipt.research_escalation
          ?.fallback?.model_returned ?? "",
      ).startsWith("gpt-5.5")
      && landmarkPckCampaignResearchPlanReceipt.evidence_summary
        ?.running_best?.test_pck_010 === 0.6633
      && landmarkPckCampaignResearchPlanReceipt.evidence_summary
        ?.running_best?.test_pck_005 === 0.3722
      && landmarkPckCampaignResearchPlanReceipt.evidence_summary
        ?.rejected_w64_quality_filtered_retrain?.test_pck_010 === 0.6484
      && landmarkPckCampaignResearchPlanReceipt.evidence_summary
        ?.rejected_w64_quality_filtered_retrain?.test_pck_005 === 0.3651
      && landmarkPckCampaignResearchPlanReceipt.research_guidance_summary
        ?.selected_first_experiment
        === "w96_heatmap48_full_train_no_destructive_quality_filter"
      && landmarkPckCampaignResearchPlanReceipt.selected_first_run?.next_action
        === landmarkPckCampaignRun1NextAction
      && landmarkPckCampaignResearchPlanReceipt.selected_first_run
        ?.hyperparameters?.width === 96
      && landmarkPckCampaignResearchPlanReceipt.selected_first_run
        ?.hyperparameters?.heatmap_grid === 48
      && landmarkPckCampaignResearchPlanReceipt.selected_first_run
        ?.hyperparameters?.train_quality_filter === false
      && landmarkPckCampaignResearchPlanReceipt.selected_first_run
        ?.hyperparameters?.max_train_batches === null
      && landmarkPckCampaignResearchPlanReceipt.selected_first_run
        ?.command_shape?.training?.includes("--width 96")
      && landmarkPckCampaignResearchPlanReceipt.selected_first_run
        ?.command_shape?.training?.includes("--heatmap-g 48")
      && !landmarkPckCampaignResearchPlanReceipt.selected_first_run
        ?.command_shape?.training?.includes("--filter-train-quality")
      && landmarkPckCampaignResearchPlanReceipt.runtime_boundary?.brev_used
        === false
      && landmarkPckCampaignResearchPlanReceipt.runtime_boundary?.training_run
        === false
      && landmarkPckCampaignResearchPlanReceipt.runtime_boundary
        ?.optimizer_or_backward === false
      && landmarkPckCampaignResearchPlanReceipt.runtime_boundary
        ?.checkpoint_written === false
      && landmarkPckCampaignResearchPlanReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && landmarkPckCampaignResearchPlanReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && landmarkPckCampaignResearchPlanReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && landmarkPckCampaignResearchPlanReceipt.runtime_boundary
        ?.final_gate_changed === false
      && landmarkPckCampaignResearchPlanReceipt.next_action
        === landmarkPckCampaignRun1NextAction,
    {
      path: landmarkPckCampaignResearchPlanReceiptPath,
      status: landmarkPckCampaignResearchPlanReceipt.status ?? null,
      research_escalation:
        landmarkPckCampaignResearchPlanReceipt.research_escalation ?? null,
      selected_first_run:
        landmarkPckCampaignResearchPlanReceipt.selected_first_run ?? null,
      runtime_boundary:
        landmarkPckCampaignResearchPlanReceipt.runtime_boundary ?? null,
      next_action: landmarkPckCampaignResearchPlanReceipt.next_action ?? null,
    },
    "landmark PCK campaign research plan must record the GPT-Pro browser block, API fallback, selected w96/g48 full-train no-filter first run, and no Brev/training in this slice",
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_campaign_run1_completed_clear_win_stopped_and_fail_closed",
    landmarkPckCampaignRun1Receipt.schema_version
      === "asl-pilot-m3jb-landmark-pck-campaign-run/v1"
      && landmarkPckCampaignRun1Receipt.status
        === "completed_clear_win_fail_closed_not_gate_passing_worker_stopped"
      && landmarkPckCampaignRun1Receipt.source_of_truth
        ?.research_plan_receipt === landmarkPckCampaignResearchPlanReceiptPath
      && landmarkPckCampaignRun1Receipt.approval_state?.campaign_cap_usd === 50
      && landmarkPckCampaignRun1Receipt.approval_state
        ?.current_human_campaign_approval_recorded_in_goal_and_prompt === true
      && landmarkPckCampaignRun1Receipt.worker?.preflight?.cuda_available === true
      && landmarkPckCampaignRun1Receipt.worker?.preflight
        ?.active_training_process_found === false
      && landmarkPckCampaignRun1Receipt.worker?.preflight
        ?.planned_outputs_absent_before_launch === true
      && landmarkPckCampaignRun1Receipt.trainer_support_patch
        ?.original_trainer_sha256
        === "75be98e185faf79215664ee811291a92ea0b8fcc87b7d9b4a2e83e6f116f9f77"
      && landmarkPckCampaignRun1Receipt.trainer_support_patch
        ?.patched_trainer_sha256
        === "d3fb5ef6ec6b024f05965a149d250374c92601e82b6dfe4052f7e8e36cd4f128"
      && landmarkPckCampaignRun1Receipt.trainer_support_patch
        ?.remote_shape_smoke_output === "(2, 21, 48, 48)"
      && landmarkPckCampaignRun1Receipt.experiment?.hyperparameters?.width === 96
      && landmarkPckCampaignRun1Receipt.experiment?.hyperparameters
        ?.heatmap_grid === 48
      && landmarkPckCampaignRun1Receipt.experiment?.hyperparameters
        ?.train_quality_filter === false
      && landmarkPckCampaignRun1Receipt.experiment?.hyperparameters
        ?.max_train_batches === null
      && landmarkPckCampaignRun1Receipt.experiment?.best_epoch === 65
      && landmarkPckCampaignRun1Receipt.experiment?.best_validation?.PCK
        === 0.6978
      && landmarkPckCampaignRun1Receipt.experiment?.training_receipt_test?.PCK
        === 0.7392
      && landmarkPckCampaignRun1Receipt.evaluation?.pck_010?.test?.PCK
        === 0.7392
      && landmarkPckCampaignRun1Receipt.evaluation?.pck_005?.test?.PCK
        === 0.4533
      && landmarkPckCampaignRun1Receipt.metrics?.running_best_pck_010 === 0.6633
      && landmarkPckCampaignRun1Receipt.metrics?.running_best_pck_005 === 0.3722
      && landmarkPckCampaignRun1Receipt.metrics?.delta_vs_running_best_pck_010 > 0
      && landmarkPckCampaignRun1Receipt.metrics?.delta_vs_running_best_pck_005 > 0
      && landmarkPckCampaignRun1Receipt.metrics?.gate_pck_010 === 0.9
      && landmarkPckCampaignRun1Receipt.metrics?.gate_pck_005 === 0.75
      && landmarkPckCampaignRun1Receipt.metrics?.decision
        === "clear_win_vs_running_best_but_fail_closed_below_landmark_gates"
      && Object.values(landmarkPckCampaignRun1Receipt.copied_artifacts ?? {})
        .filter((artifact) => artifact && typeof artifact === "object" && "copied_back" in artifact)
        .every((artifact) => artifact.copied_back === true)
      && exists(sideReceipts.landmarkPckCampaignRun1)
      && exists(sideReceipts.landmarkPckCampaignRun1Weights)
      && exists(sideReceipts.landmarkPckCampaignRun1EvalPck010)
      && exists(sideReceipts.landmarkPckCampaignRun1EvalPck005)
      && landmarkPckCampaignRun1EvalPck010.test?.PCK === 0.7392
      && landmarkPckCampaignRun1EvalPck005.test?.PCK === 0.4533
      && landmarkPckCampaignRun1Receipt.worker?.teardown?.final_status === "STOPPED"
      && landmarkPckCampaignRun1Receipt.worker?.teardown?.final_shell_status
        === "NOT READY"
      && landmarkPckCampaignRun1Receipt.runtime_boundary?.brev_used === true
      && landmarkPckCampaignRun1Receipt.runtime_boundary?.training_run === true
      && landmarkPckCampaignRun1Receipt.runtime_boundary?.eval_only_pck_run
        === true
      && landmarkPckCampaignRun1Receipt.runtime_boundary?.checkpoint_written
        === true
      && landmarkPckCampaignRun1Receipt.runtime_boundary?.worker_stopped_after_run
        === true
      && landmarkPckCampaignRun1Receipt.runtime_boundary?.browser_artifact_promoted
        === false
      && landmarkPckCampaignRun1Receipt.runtime_boundary?.raw_learner_video_upload
        === false
      && landmarkPckCampaignRun1Receipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && landmarkPckCampaignRun1Receipt.runtime_boundary?.final_gate_changed === false
      && landmarkPckCampaignRun1Receipt.next_experiment_candidate?.next_action
        === landmarkPckCampaignRun2NextAction
      && landmarkPckCampaignRun1Receipt.next_action === landmarkPckCampaignRun2NextAction,
    {
      path: landmarkPckCampaignRun1ReceiptPath,
      status: landmarkPckCampaignRun1Receipt.status ?? null,
      metrics: landmarkPckCampaignRun1Receipt.metrics ?? null,
      trainer_support_patch:
        landmarkPckCampaignRun1Receipt.trainer_support_patch ?? null,
      copied_artifacts: landmarkPckCampaignRun1Receipt.copied_artifacts ?? null,
      worker_teardown: landmarkPckCampaignRun1Receipt.worker?.teardown ?? null,
      runtime_boundary:
        landmarkPckCampaignRun1Receipt.runtime_boundary ?? null,
      next_action: landmarkPckCampaignRun1Receipt.next_action ?? null,
    },
    "landmark PCK campaign run1 must improve both running-best PCK metrics, remain fail-closed below gates, copy planned artifacts back, stop the worker, and select the next research-guided run",
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_campaign_run2_completed_clear_win_stopped_and_fail_closed",
    landmarkPckCampaignRun2Receipt.schema_version
      === "asl-pilot-m3jb-landmark-pck-campaign-run/v1"
      && landmarkPckCampaignRun2Receipt.status
        === "completed_clear_win_fail_closed_not_gate_passing_worker_stopped"
      && landmarkPckCampaignRun2Receipt.source_of_truth
        ?.research_plan_receipt === landmarkPckCampaignResearchPlanReceiptPath
      && landmarkPckCampaignRun2Receipt.source_of_truth
        ?.previous_running_best_receipt === landmarkPckCampaignRun1ReceiptPath
      && landmarkPckCampaignRun2Receipt.approval_state?.campaign_cap_usd === 50
      && landmarkPckCampaignRun2Receipt.approval_state
        ?.current_human_campaign_approval_recorded_in_goal_and_prompt === true
      && landmarkPckCampaignRun2Receipt.approval_state?.next_run_token
        === landmarkPckCampaignRun3NextAction
      && landmarkPckCampaignRun2Receipt.worker?.preflight?.cuda_available === true
      && landmarkPckCampaignRun2Receipt.worker?.preflight
        ?.active_training_process_found === false
      && landmarkPckCampaignRun2Receipt.worker?.preflight
        ?.planned_outputs_absent_before_launch === true
      && landmarkPckCampaignRun2Receipt.worker?.preflight?.trainer_sha256
        === "d3fb5ef6ec6b024f05965a149d250374c92601e82b6dfe4052f7e8e36cd4f128"
      && landmarkPckCampaignRun2Receipt.worker?.preflight?.rows_json_sha256
        === "693f2dfb2b740d5a0ec763ccc9b65a8521ef40607587f26e41421ebb4551a173"
      && landmarkPckCampaignRun2Receipt.worker?.preflight?.splits_json_sha256
        === "f8afb677179cdbf3fc11392c95ee0aede6c09d27cd86a336720d7eabb17f1d0f"
      && landmarkPckCampaignRun2Receipt.worker?.preflight?.shape_smoke_output
        === "(2, 21, 64, 64)"
      && landmarkPckCampaignRun2Receipt.experiment?.hyperparameters?.width === 128
      && landmarkPckCampaignRun2Receipt.experiment?.hyperparameters
        ?.heatmap_grid === 64
      && landmarkPckCampaignRun2Receipt.experiment?.hyperparameters?.batch === 128
      && landmarkPckCampaignRun2Receipt.experiment?.hyperparameters
        ?.eval_batch === 512
      && landmarkPckCampaignRun2Receipt.experiment?.hyperparameters
        ?.train_quality_filter === false
      && landmarkPckCampaignRun2Receipt.experiment?.hyperparameters
        ?.max_train_batches === null
      && landmarkPckCampaignRun2Receipt.experiment?.best_epoch === 70
      && landmarkPckCampaignRun2Receipt.experiment?.best_validation?.PCK
        === 0.7098
      && landmarkPckCampaignRun2Receipt.experiment?.training_receipt_test?.PCK
        === 0.7496
      && landmarkPckCampaignRun2Receipt.evaluation?.pck_010?.test?.PCK
        === 0.7496
      && landmarkPckCampaignRun2Receipt.evaluation?.pck_005?.test?.PCK
        === 0.4867
      && landmarkPckCampaignRun2Receipt.metrics?.running_best_pck_010 === 0.7392
      && landmarkPckCampaignRun2Receipt.metrics?.running_best_pck_005 === 0.4533
      && landmarkPckCampaignRun2Receipt.metrics?.delta_vs_running_best_pck_010 > 0
      && landmarkPckCampaignRun2Receipt.metrics?.delta_vs_running_best_pck_005 > 0
      && landmarkPckCampaignRun2Receipt.metrics?.gate_pck_010 === 0.9
      && landmarkPckCampaignRun2Receipt.metrics?.gate_pck_005 === 0.75
      && landmarkPckCampaignRun2Receipt.metrics?.decision
        === "clear_win_vs_running_best_but_fail_closed_below_landmark_gates"
      && Object.values(landmarkPckCampaignRun2Receipt.copied_artifacts ?? {})
        .filter((artifact) => artifact && typeof artifact === "object" && "copied_back" in artifact)
        .every((artifact) => artifact.copied_back === true)
      && exists(sideReceipts.landmarkPckCampaignRun2)
      && exists(sideReceipts.landmarkPckCampaignRun2Weights)
      && exists(sideReceipts.landmarkPckCampaignRun2EvalPck010)
      && exists(sideReceipts.landmarkPckCampaignRun2EvalPck005)
      && landmarkPckCampaignRun2.test?.PCK === 0.7496
      && landmarkPckCampaignRun2EvalPck010.test?.PCK === 0.7496
      && landmarkPckCampaignRun2EvalPck005.test?.PCK === 0.4867
      && landmarkPckCampaignRun2Receipt.worker?.teardown?.final_status === "STOPPED"
      && landmarkPckCampaignRun2Receipt.worker?.teardown?.final_shell_status
        === "NOT READY"
      && landmarkPckCampaignRun2Receipt.runtime_boundary?.brev_used === true
      && landmarkPckCampaignRun2Receipt.runtime_boundary?.training_run === true
      && landmarkPckCampaignRun2Receipt.runtime_boundary?.eval_only_pck_run
        === true
      && landmarkPckCampaignRun2Receipt.runtime_boundary?.checkpoint_written
        === true
      && landmarkPckCampaignRun2Receipt.runtime_boundary?.worker_stopped_after_run
        === true
      && landmarkPckCampaignRun2Receipt.runtime_boundary?.browser_artifact_promoted
        === false
      && landmarkPckCampaignRun2Receipt.runtime_boundary?.raw_learner_video_upload
        === false
      && landmarkPckCampaignRun2Receipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && landmarkPckCampaignRun2Receipt.runtime_boundary?.final_gate_changed === false
      && landmarkPckCampaignRun2Receipt.next_experiment_candidate?.next_action
        === landmarkPckCampaignRun3NextAction
      && landmarkPckCampaignRun2Receipt.next_action === landmarkPckCampaignRun3NextAction,
    {
      path: landmarkPckCampaignRun2ReceiptPath,
      status: landmarkPckCampaignRun2Receipt.status ?? null,
      metrics: landmarkPckCampaignRun2Receipt.metrics ?? null,
      copied_artifacts: landmarkPckCampaignRun2Receipt.copied_artifacts ?? null,
      worker_teardown: landmarkPckCampaignRun2Receipt.worker?.teardown ?? null,
      next_experiment_candidate:
        landmarkPckCampaignRun2Receipt.next_experiment_candidate ?? null,
      runtime_boundary:
        landmarkPckCampaignRun2Receipt.runtime_boundary ?? null,
      next_action: landmarkPckCampaignRun2Receipt.next_action ?? null,
    },
    "landmark PCK campaign run2 must improve both run1 PCK metrics, remain fail-closed below gates, copy planned artifacts back, stop the worker, and select the next research-guided run",
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_campaign_run3_completed_no_clear_win_stopped_and_fail_closed",
    landmarkPckCampaignRun3Receipt.schema_version
      === "asl-pilot-m3jb-landmark-pck-campaign-run/v1"
      && landmarkPckCampaignRun3Receipt.status
        === "completed_no_clear_win_fail_closed_not_gate_passing_worker_stopped"
      && landmarkPckCampaignRun3Receipt.source_of_truth
        ?.research_plan_receipt === landmarkPckCampaignResearchPlanReceiptPath
      && landmarkPckCampaignRun3Receipt.source_of_truth
        ?.previous_running_best_receipt === landmarkPckCampaignRun2ReceiptPath
      && landmarkPckCampaignRun3Receipt.approval_state?.campaign_cap_usd === 50
      && landmarkPckCampaignRun3Receipt.approval_state
        ?.current_human_campaign_approval_recorded_in_goal_and_prompt === true
      && landmarkPckCampaignRun3Receipt.approval_state?.next_run_token
        === landmarkPckResearchRefreshAfterRun3NextAction
      && landmarkPckCampaignRun3Receipt.approval_state
        ?.consecutive_research_guided_failures_since_last_running_best === 1
      && landmarkPckCampaignRun3Receipt.worker?.preflight?.cuda_available === true
      && landmarkPckCampaignRun3Receipt.worker?.preflight
        ?.active_training_process_found === false
      && landmarkPckCampaignRun3Receipt.worker?.preflight
        ?.planned_outputs_absent_before_launch === true
      && landmarkPckCampaignRun3Receipt.worker?.preflight?.trainer_sha256
        === "d3fb5ef6ec6b024f05965a149d250374c92601e82b6dfe4052f7e8e36cd4f128"
      && landmarkPckCampaignRun3Receipt.worker?.preflight?.rows_json_sha256
        === "693f2dfb2b740d5a0ec763ccc9b65a8521ef40607587f26e41421ebb4551a173"
      && landmarkPckCampaignRun3Receipt.worker?.preflight?.splits_json_sha256
        === "f8afb677179cdbf3fc11392c95ee0aede6c09d27cd86a336720d7eabb17f1d0f"
      && landmarkPckCampaignRun3Receipt.worker?.preflight?.shape_smoke_output
        === "(2, 21, 64, 64)"
      && landmarkPckCampaignRun3Receipt.experiment?.hyperparameters?.width === 128
      && landmarkPckCampaignRun3Receipt.experiment?.hyperparameters
        ?.heatmap_grid === 64
      && landmarkPckCampaignRun3Receipt.experiment?.hyperparameters?.batch === 128
      && landmarkPckCampaignRun3Receipt.experiment?.hyperparameters
        ?.eval_batch === 512
      && landmarkPckCampaignRun3Receipt.experiment?.hyperparameters
        ?.train_quality_filter === false
      && landmarkPckCampaignRun3Receipt.experiment?.hyperparameters
        ?.oversample_hard_geometry === 2
      && landmarkPckCampaignRun3Receipt.experiment?.hyperparameters
        ?.hard_include_oob === true
      && landmarkPckCampaignRun3Receipt.experiment?.hyperparameters
        ?.affine_aug_prob === 0.35
      && landmarkPckCampaignRun3Receipt.experiment?.hyperparameters
        ?.max_train_batches === null
      && landmarkPckCampaignRun3Receipt.experiment?.best_epoch === 80
      && landmarkPckCampaignRun3Receipt.experiment?.best_validation?.PCK
        === 0.6951
      && landmarkPckCampaignRun3Receipt.experiment?.training_receipt_test?.PCK
        === 0.734
      && landmarkPckCampaignRun3Receipt.evaluation?.pck_010?.test?.PCK
        === 0.734
      && landmarkPckCampaignRun3Receipt.evaluation?.pck_005?.test?.PCK
        === 0.4506
      && landmarkPckCampaignRun3Receipt.metrics?.running_best_pck_010 === 0.7496
      && landmarkPckCampaignRun3Receipt.metrics?.running_best_pck_005 === 0.4867
      && landmarkPckCampaignRun3Receipt.metrics?.delta_vs_running_best_pck_010 < 0
      && landmarkPckCampaignRun3Receipt.metrics?.delta_vs_running_best_pck_005 < 0
      && landmarkPckCampaignRun3Receipt.metrics?.gate_pck_010 === 0.9
      && landmarkPckCampaignRun3Receipt.metrics?.gate_pck_005 === 0.75
      && landmarkPckCampaignRun3Receipt.metrics?.decision
        === "no_clear_win_vs_running_best_fail_closed_below_landmark_gates"
      && Object.values(landmarkPckCampaignRun3Receipt.copied_artifacts ?? {})
        .filter((artifact) => artifact && typeof artifact === "object" && "copied_back" in artifact)
        .every((artifact) => artifact.copied_back === true)
      && exists(sideReceipts.landmarkPckCampaignRun3)
      && exists(sideReceipts.landmarkPckCampaignRun3Weights)
      && exists(sideReceipts.landmarkPckCampaignRun3EvalPck010)
      && exists(sideReceipts.landmarkPckCampaignRun3EvalPck005)
      && landmarkPckCampaignRun3.test?.PCK === 0.734
      && landmarkPckCampaignRun3EvalPck010.test?.PCK === 0.734
      && landmarkPckCampaignRun3EvalPck005.test?.PCK === 0.4506
      && landmarkPckCampaignRun3Receipt.worker?.teardown?.final_status === "STOPPED"
      && landmarkPckCampaignRun3Receipt.worker?.teardown?.final_shell_status
        === "NOT READY"
      && landmarkPckCampaignRun3Receipt.runtime_boundary?.brev_used === true
      && landmarkPckCampaignRun3Receipt.runtime_boundary?.training_run === true
      && landmarkPckCampaignRun3Receipt.runtime_boundary?.eval_only_pck_run
        === true
      && landmarkPckCampaignRun3Receipt.runtime_boundary?.checkpoint_written
        === true
      && landmarkPckCampaignRun3Receipt.runtime_boundary?.worker_stopped_after_run
        === true
      && landmarkPckCampaignRun3Receipt.runtime_boundary?.browser_artifact_promoted
        === false
      && landmarkPckCampaignRun3Receipt.runtime_boundary?.raw_learner_video_upload
        === false
      && landmarkPckCampaignRun3Receipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && landmarkPckCampaignRun3Receipt.runtime_boundary?.final_gate_changed === false
      && landmarkPckCampaignRun3Receipt.next_experiment_candidate?.next_action
        === landmarkPckResearchRefreshAfterRun3NextAction
      && landmarkPckCampaignRun3Receipt.next_action
        === landmarkPckResearchRefreshAfterRun3NextAction,
    {
      path: landmarkPckCampaignRun3ReceiptPath,
      status: landmarkPckCampaignRun3Receipt.status ?? null,
      metrics: landmarkPckCampaignRun3Receipt.metrics ?? null,
      copied_artifacts: landmarkPckCampaignRun3Receipt.copied_artifacts ?? null,
      worker_teardown: landmarkPckCampaignRun3Receipt.worker?.teardown ?? null,
      next_experiment_candidate:
        landmarkPckCampaignRun3Receipt.next_experiment_candidate ?? null,
      runtime_boundary:
        landmarkPckCampaignRun3Receipt.runtime_boundary ?? null,
      next_action: landmarkPckCampaignRun3Receipt.next_action ?? null,
    },
    "landmark PCK campaign run3 must record the no-clear-win regression vs run2, remain fail-closed below gates, copy planned artifacts back, stop the worker, and select a no-Brev research refresh",
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_research_refresh_after_run3_selects_resunet_preflight_no_brev",
    landmarkPckResearchRefreshAfterRun3Receipt.schema_version
      === "asl-pilot-m3jb-landmark-pck-research-refresh/v1"
      && landmarkPckResearchRefreshAfterRun3Receipt.status
        === "completed_research_refresh_no_brev_no_training"
      && landmarkPckResearchRefreshAfterRun3Receipt.source_of_truth
        ?.running_best_receipt === landmarkPckCampaignRun2ReceiptPath
      && landmarkPckResearchRefreshAfterRun3Receipt.source_of_truth
        ?.no_clear_win_receipt === landmarkPckCampaignRun3ReceiptPath
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.required_by_goal === true
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.action_token === landmarkPckResearchRefreshAfterRun3NextAction
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.gpt_pro_web_attempt?.attempted === true
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.gpt_pro_web_attempt?.status === "blocked_browser_iab_unavailable"
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.fallback?.used === true
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.fallback?.route === "openai-api-research"
      && String(
        landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
          ?.fallback?.model_returned ?? "",
      ).startsWith("gpt-5.5")
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.fallback?.prompt_path === landmarkPckResearchRefreshAfterRun3PromptPath
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.fallback?.request_path === landmarkPckResearchRefreshAfterRun3RequestPath
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.fallback?.raw_response_path === landmarkPckResearchRefreshAfterRun3RawPath
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.fallback?.response_path === landmarkPckResearchRefreshAfterRun3ResponsePath
      && exists(path.join(root, landmarkPckResearchRefreshAfterRun3PromptPath))
      && exists(path.join(root, landmarkPckResearchRefreshAfterRun3RequestPath))
      && exists(path.join(root, landmarkPckResearchRefreshAfterRun3RawPath))
      && exists(path.join(root, landmarkPckResearchRefreshAfterRun3ResponsePath))
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.fallback?.prompt_sha256
        === sha256(path.join(root, landmarkPckResearchRefreshAfterRun3PromptPath))
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.fallback?.request_sha256
        === sha256(path.join(root, landmarkPckResearchRefreshAfterRun3RequestPath))
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.fallback?.raw_response_sha256
        === sha256(path.join(root, landmarkPckResearchRefreshAfterRun3RawPath))
      && landmarkPckResearchRefreshAfterRun3Receipt.research_escalation
        ?.fallback?.response_sha256
        === sha256(path.join(root, landmarkPckResearchRefreshAfterRun3ResponsePath))
      && landmarkPckResearchRefreshAfterRun3Receipt.evidence_summary
        ?.running_best_run2?.test_pck_010 === 0.7496
      && landmarkPckResearchRefreshAfterRun3Receipt.evidence_summary
        ?.running_best_run2?.test_pck_005 === 0.4867
      && landmarkPckResearchRefreshAfterRun3Receipt.evidence_summary
        ?.no_clear_win_run3?.test_pck_010 === 0.734
      && landmarkPckResearchRefreshAfterRun3Receipt.evidence_summary
        ?.no_clear_win_run3?.test_pck_005 === 0.4506
      && landmarkPckResearchRefreshAfterRun3Receipt.research_guidance_summary
        ?.requires_local_code_changes_before_brev === true
      && String(
        landmarkPckResearchRefreshAfterRun3Receipt.research_guidance_summary
          ?.recommended_next_highest_impact_lever ?? "",
      ).includes("residual")
      && landmarkPckResearchRefreshAfterRun3Receipt.research_guidance_summary
        ?.selected_next_action === landmarkPckResunetArchitecturePreflightNextAction
      && landmarkPckResearchRefreshAfterRun3Receipt.research_guidance_summary
        ?.candidate_paid_run_after_preflight === landmarkPckRun4ResunetG64BrevToken
      && landmarkPckResearchRefreshAfterRun3Receipt.next_action_scope
        ?.next_action === landmarkPckResunetArchitecturePreflightNextAction
      && landmarkPckResearchRefreshAfterRun3Receipt.next_action_scope
        ?.brev_allowed_in_next_action === false
      && landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary?.brev_used
        === false
      && landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary
        ?.brev_exec_or_copy === false
      && landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary
        ?.training_run === false
      && landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary
        ?.optimizer_or_backward === false
      && landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary
        ?.checkpoint_written === false
      && landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary
        ?.final_gate_changed === false
      && landmarkPckResearchRefreshAfterRun3Receipt.next_action
        === landmarkPckResunetArchitecturePreflightNextAction,
    {
      path: landmarkPckResearchRefreshAfterRun3ReceiptPath,
      status: landmarkPckResearchRefreshAfterRun3Receipt.status ?? null,
      research_escalation:
        landmarkPckResearchRefreshAfterRun3Receipt.research_escalation ?? null,
      research_guidance_summary:
        landmarkPckResearchRefreshAfterRun3Receipt.research_guidance_summary ?? null,
      next_action_scope:
        landmarkPckResearchRefreshAfterRun3Receipt.next_action_scope ?? null,
      runtime_boundary:
        landmarkPckResearchRefreshAfterRun3Receipt.runtime_boundary ?? null,
      next_action:
        landmarkPckResearchRefreshAfterRun3Receipt.next_action ?? null,
    },
    "post-run3 research refresh must record GPT-Pro browser block, gpt-5.5 API fallback, scratch residual heatmap architecture preflight selection, and no Brev/training boundary",
  );
  addCheck(
    checks,
    blockers,
    "landmark_pck_resunet_architecture_preflight_passed_no_brev_and_selects_run4",
    landmarkPckResunetArchitecturePreflightReceipt.schema_version
      === "asl-pilot-m3jb-landmark-pck-resunet-architecture-preflight/v1"
      && landmarkPckResunetArchitecturePreflightReceipt.status
        === "passed_local_architecture_preflight_no_brev_no_training"
      && landmarkPckResunetArchitecturePreflightReceipt.source_of_truth
        ?.research_refresh_receipt === landmarkPckResearchRefreshAfterRun3ReceiptPath
      && landmarkPckResunetArchitecturePreflightReceipt.side_worktree
        ?.code_commit === "712ab989d9451e92894ee72fc73e757a21f6d1ea"
      && landmarkPckResunetArchitecturePreflightReceipt.side_worktree
        ?.trainer_path === sidePerHandLandmarkTrainerPath
      && exists(sidePerHandLandmarkTrainerPath)
      && landmarkPckResunetArchitecturePreflightReceipt.side_worktree
        ?.trainer_sha256 === sha256(sidePerHandLandmarkTrainerPath)
      && landmarkPckResunetArchitecturePreflightReceipt.implementation
        ?.model_arch_added === "perhand_resunet_heatmap"
      && landmarkPckResunetArchitecturePreflightReceipt.implementation
        ?.default_model_arch_preserved === "perhand_heatmap"
      && landmarkPckResunetArchitecturePreflightReceipt.implementation
        ?.input_contract?.channels === 5
      && landmarkPckResunetArchitecturePreflightReceipt.implementation
        ?.input_contract?.crop_size === 128
      && landmarkPckResunetArchitecturePreflightReceipt.implementation
        ?.output_contract?.keypoints === 21
      && landmarkPckResunetArchitecturePreflightReceipt.implementation
        ?.output_contract?.heatmap_grid === 64
      && JSON.stringify(
        landmarkPckResunetArchitecturePreflightReceipt.implementation
          ?.output_contract?.heatmap_shape,
      ) === JSON.stringify([2, 21, 64, 64])
      && JSON.stringify(
        landmarkPckResunetArchitecturePreflightReceipt.implementation
          ?.output_contract?.decode_shape,
      ) === JSON.stringify([2, 21, 2])
      && Array.isArray(
        landmarkPckResunetArchitecturePreflightReceipt.implementation
          ?.cli_flags_added,
      )
      && landmarkPckResunetArchitecturePreflightReceipt.implementation
        .cli_flags_added.includes("--model-arch")
      && landmarkPckResunetArchitecturePreflightReceipt.implementation
        .cli_flags_added.includes("--smoke-architecture")
      && landmarkPckResunetArchitecturePreflightReceipt.implementation
        ?.pretrained_dependencies_added === false
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.red_status === "failed_as_expected_unrecognized_model_arch_and_smoke_flags"
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.syntax_status === "passed"
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_status === "passed"
      && exists(sidePerHandResunetArchitectureSmokePath)
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_sha256 === sha256(sidePerHandResunetArchitectureSmokePath)
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_payload?.status === "passed_no_training_no_checkpoint"
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_payload?.model_arch === "perhand_resunet_heatmap"
      && JSON.stringify(
        landmarkPckResunetArchitecturePreflightReceipt.local_smoke
          ?.smoke_payload?.heatmap_shape,
      ) === JSON.stringify([2, 21, 64, 64])
      && JSON.stringify(
        landmarkPckResunetArchitecturePreflightReceipt.local_smoke
          ?.smoke_payload?.decode_shape,
      ) === JSON.stringify([2, 21, 2])
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_payload?.parameter_count === 15358485
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_payload?.loss?.finite === true
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_payload?.runtime_boundary?.brev_used === false
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_payload?.runtime_boundary?.training_run === false
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_payload?.runtime_boundary?.optimizer_constructed === false
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_payload?.runtime_boundary?.backward_called === false
      && landmarkPckResunetArchitecturePreflightReceipt.local_smoke
        ?.smoke_payload?.runtime_boundary?.checkpoint_written === false
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.next_action === landmarkPckRun4ResunetG64BrevToken
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.max_outer_runtime_seconds === 21600
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.training_timeout_seconds === 20000
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.eval_timeout_seconds === 3600
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.campaign_total_cap_usd === 50
      && String(
        landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
          ?.command_shape?.training ?? "",
      ).includes("--model-arch perhand_resunet_heatmap")
      && String(
        landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
          ?.command_shape?.training ?? "",
      ).includes("timeout 21600s brev exec asl-pilot-m3eh-l40s-001")
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.model_architecture_changed === true
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.width === 128
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.heatmap_grid === 64
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.sigma === 2
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.epochs === 100
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.batch === 128
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.eval_batch === 512
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.lr === 0.0005
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.train_quality_filter === false
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.oversample_hard_geometry === 0
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.affine_aug_prob === 0
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.blur_prob === 0
      && landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
        ?.controlled_against_run2?.noise_std === 0
      && String(
        landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
          ?.success_signal ?? "",
      ).includes("0.749600")
      && String(
        landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
          ?.success_signal ?? "",
      ).includes("0.486700")
      && String(
        landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
          ?.kill_condition ?? "",
      ).includes("validation PCK@0.10 has never matched run2 validation PCK@0.10")
      && String(
        landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
          ?.kill_condition ?? "",
      ).includes("0.709800")
      && String(
        landmarkPckResunetArchitecturePreflightReceipt.run4_envelope
          ?.teardown ?? "",
      ).includes("`STOPPED` / `NOT READY`")
      && landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary
        ?.brev_used === false
      && landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary
        ?.brev_exec_or_copy === false
      && landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary
        ?.training_run === false
      && landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary
        ?.optimizer_or_backward === false
      && landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary
        ?.checkpoint_written === false
      && landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary
        ?.final_gate_changed === false
      && landmarkPckResunetArchitecturePreflightReceipt.next_action
        === landmarkPckRun4ResunetG64BrevToken,
    {
      path: landmarkPckResunetArchitecturePreflightReceiptPath,
      status: landmarkPckResunetArchitecturePreflightReceipt.status ?? null,
      side_worktree:
        landmarkPckResunetArchitecturePreflightReceipt.side_worktree ?? null,
      implementation:
        landmarkPckResunetArchitecturePreflightReceipt.implementation ?? null,
      local_smoke:
        landmarkPckResunetArchitecturePreflightReceipt.local_smoke ?? null,
      run4_envelope:
        landmarkPckResunetArchitecturePreflightReceipt.run4_envelope ?? null,
      runtime_boundary:
        landmarkPckResunetArchitecturePreflightReceipt.runtime_boundary ?? null,
      next_action: landmarkPckResunetArchitecturePreflightReceipt.next_action ?? null,
    },
    "local ResUNet/hourglass preflight must pass without Brev/training, hash-match side trainer and smoke artifacts, preserve the 5-channel/21x64x64 soft-argmax contract, and select the exact run4 envelope",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_scheduler_preflight_passed_no_brev_and_selects_run3",
    recognizerSchedulerPreflightReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-lr-schedule-preflight/v1"
      && recognizerSchedulerPreflightReceipt.status
        === "passed_scheduler_preflight_no_brev_no_checkpoint"
      && recognizerSchedulerPreflightReceipt.slice
        === recognizerSchedulerPreflightNextAction
      && recognizerSchedulerPreflightReceipt.side_worktree?.code_commit
        === "8a780aef462e616d365319a1ef577f9d93395979"
      && recognizerSchedulerPreflightReceipt.side_worktree?.trainer_path
        === sideRecognizerTrainerPath
      && recognizerSchedulerPreflightReceipt.side_worktree?.trainer_sha256
        === "bfa4ed698da20561e3b3005f56467edec42161f0269e3fc57535c7701b392898"
      && recognizerSchedulerPreflightReceipt.side_worktree?.diagnostics_test_path
        === sideRecognizerDiagnosticsTestPath
      && recognizerSchedulerPreflightReceipt.side_worktree?.diagnostics_test_sha256
        === "6f9a4b282f1ee33d84174a4db17cfb1a902252fc751a96e4253b896e3a3e5942"
      && Array.isArray(
        recognizerSchedulerPreflightReceipt.implementation
          ?.scheduler_flags_added,
      )
      && recognizerSchedulerPreflightReceipt.implementation.scheduler_flags_added
        .includes("--lr-scheduler")
      && recognizerSchedulerPreflightReceipt.implementation.scheduler_flags_added
        .includes("--warmup-steps")
      && recognizerSchedulerPreflightReceipt.implementation.scheduler_flags_added
        .includes("--min-lr")
      && recognizerSchedulerPreflightReceipt.implementation
        ?.fixed_lr_default_preserved === true
      && recognizerSchedulerPreflightReceipt.implementation
        ?.zero_epoch_preflight_preserved === true
      && recognizerSchedulerPreflightReceipt.implementation
        ?.pretrained_dependencies_added === false
      && recognizerSchedulerPreflightReceipt.local_preflight?.tiny_overfit
        ?.receipt_path === recognizerSchedulerTinyOverfitReceiptPath
      && recognizerSchedulerPreflightReceipt.local_preflight?.tiny_overfit
        ?.receipt_sha256 === sha256(recognizerSchedulerTinyOverfitReceiptFilePath)
      && recognizerSchedulerTinyOverfitReceipt.no_save_model === true
      && recognizerSchedulerTinyOverfitReceipt.weights === null
      && recognizerSchedulerTinyOverfitReceipt.train_clips === 32
      && recognizerSchedulerTinyOverfitReceipt.monitor_clips === 32
      && recognizerSchedulerTinyOverfitReceipt.test_clips === 32
      && recognizerSchedulerTinyOverfitReceipt.optimizer_steps === 240
      && recognizerSchedulerTinyOverfitReceipt.expected_optimizer_steps === 240
      && recognizerSchedulerTinyOverfitReceipt.steps_per_epoch === 2
      && recognizerSchedulerTinyOverfitReceipt.lr_scheduler?.name === "cosine"
      && recognizerSchedulerTinyOverfitReceipt.lr_scheduler?.warmup_steps === 10
      && recognizerSchedulerTinyOverfitReceipt.lr_scheduler?.min_lr === 0.00005
      && recognizerSchedulerTinyOverfitReceipt.history?.[0]?.lr_first === 0.00005
      && recognizerSchedulerTinyOverfitReceipt.history?.[0]?.lr_last === 0.0001
      && recognizerSchedulerTinyOverfitReceipt.history?.at(-1)?.lr_last === 0.00005
      && recognizerSchedulerTinyOverfitReceipt.history_best_train_top1 === 1
      && recognizerSchedulerTinyOverfitReceipt.history_final_train_top1 === 1
      && recognizerSchedulerPreflightReceipt.local_preflight?.full_data_smoke
        ?.receipt_path === recognizerSchedulerFullDataSmokeReceiptPath
      && recognizerSchedulerPreflightReceipt.local_preflight?.full_data_smoke
        ?.receipt_sha256 === sha256(recognizerSchedulerFullDataSmokeReceiptFilePath)
      && recognizerSchedulerPreflightReceipt.local_preflight?.full_data_smoke
        ?.full_data_no_limit_flags === true
      && recognizerSchedulerFullDataSmokeReceipt.no_save_model === true
      && recognizerSchedulerFullDataSmokeReceipt.weights === null
      && recognizerSchedulerFullDataSmokeReceipt.train_clips === 7011
      && recognizerSchedulerFullDataSmokeReceipt.monitor_clips === 955
      && recognizerSchedulerFullDataSmokeReceipt.test_clips === 2369
      && recognizerSchedulerFullDataSmokeReceipt.optimizer_steps === 55
      && recognizerSchedulerFullDataSmokeReceipt.expected_optimizer_steps === 55
      && recognizerSchedulerFullDataSmokeReceipt.steps_per_epoch === 55
      && recognizerSchedulerFullDataSmokeReceipt.lr_scheduler?.name === "cosine"
      && recognizerSchedulerFullDataSmokeReceipt.lr_scheduler?.warmup_steps === 1
      && recognizerSchedulerFullDataSmokeReceipt.lr_scheduler?.min_lr === 0.00005
      && recognizerSchedulerFullDataSmokeReceipt.history?.[0]?.lr_first === 0.0005
      && recognizerSchedulerFullDataSmokeReceipt.history?.[0]?.lr_last === 0.00005
      && recognizerSchedulerPreflightReceipt.run3_envelope?.next_action
        === recognizerRun3SchedulerFulltrainNextAction
      && recognizerSchedulerPreflightReceipt.run3_envelope
        ?.expected_optimizer_steps === 13200
      && String(
        recognizerSchedulerPreflightReceipt.run3_envelope?.command_shape ?? "",
      ).includes("--lr-scheduler cosine")
      && String(
        recognizerSchedulerPreflightReceipt.run3_envelope?.command_shape ?? "",
      ).includes("--warmup-steps 500")
      && String(
        recognizerSchedulerPreflightReceipt.run3_envelope?.command_shape ?? "",
      ).includes("--min-lr 5e-5")
      && String(
        recognizerSchedulerPreflightReceipt.run3_envelope?.command_shape ?? "",
      ).includes("--batch 128")
      && recognizerSchedulerPreflightReceipt.runtime_boundary?.brev_used === false
      && recognizerSchedulerPreflightReceipt.runtime_boundary?.brev_lifecycle_or_exec === false
      && recognizerSchedulerPreflightReceipt.runtime_boundary?.checkpoint_written === false
      && recognizerSchedulerPreflightReceipt.runtime_boundary?.browser_artifact_promoted === false
      && recognizerSchedulerPreflightReceipt.runtime_boundary?.raw_learner_video_upload === false
      && recognizerSchedulerPreflightReceipt.runtime_boundary?.pretrained_runtime_dependency_added === false
      && recognizerSchedulerPreflightReceipt.runtime_boundary?.final_gate_changed === false
      && recognizerSchedulerPreflightReceipt.next_action
        === recognizerRun3SchedulerFulltrainNextAction,
    {
      path: recognizerSchedulerPreflightReceiptPath,
      status: recognizerSchedulerPreflightReceipt.status ?? null,
      side_worktree: recognizerSchedulerPreflightReceipt.side_worktree ?? null,
      implementation: recognizerSchedulerPreflightReceipt.implementation ?? null,
      tiny_overfit: {
        receipt_path:
          recognizerSchedulerPreflightReceipt.local_preflight?.tiny_overfit
            ?.receipt_path ?? null,
        train_clips: recognizerSchedulerTinyOverfitReceipt.train_clips ?? null,
        optimizer_steps:
          recognizerSchedulerTinyOverfitReceipt.optimizer_steps ?? null,
        expected_optimizer_steps:
          recognizerSchedulerTinyOverfitReceipt.expected_optimizer_steps ?? null,
        history_best_train_top1:
          recognizerSchedulerTinyOverfitReceipt.history_best_train_top1 ?? null,
        lr_first:
          recognizerSchedulerTinyOverfitReceipt.history?.[0]?.lr_first ?? null,
        lr_last:
          recognizerSchedulerTinyOverfitReceipt.history?.at(-1)?.lr_last ?? null,
      },
      full_data_smoke: {
        receipt_path:
          recognizerSchedulerPreflightReceipt.local_preflight?.full_data_smoke
            ?.receipt_path ?? null,
        train_clips:
          recognizerSchedulerFullDataSmokeReceipt.train_clips ?? null,
        monitor_clips:
          recognizerSchedulerFullDataSmokeReceipt.monitor_clips ?? null,
        test_clips:
          recognizerSchedulerFullDataSmokeReceipt.test_clips ?? null,
        optimizer_steps:
          recognizerSchedulerFullDataSmokeReceipt.optimizer_steps ?? null,
        expected_optimizer_steps:
          recognizerSchedulerFullDataSmokeReceipt.expected_optimizer_steps ?? null,
        lr_first:
          recognizerSchedulerFullDataSmokeReceipt.history?.[0]?.lr_first ?? null,
        lr_last:
          recognizerSchedulerFullDataSmokeReceipt.history?.[0]?.lr_last ?? null,
      },
      run3_envelope: recognizerSchedulerPreflightReceipt.run3_envelope ?? null,
      runtime_boundary: recognizerSchedulerPreflightReceipt.runtime_boundary ?? null,
      next_action: recognizerSchedulerPreflightReceipt.next_action ?? null,
    },
    "recognizer scheduler preflight must hash-match the side trainer, prove fixed-default scheduler flags, no-save overfit/full-data smokes, no checkpoint/Brev boundary, and select the run3 scheduler fulltrain token",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run3_scheduler_fulltrain_completed_improved_but_fail_closed",
    recognizerRun3SchedulerFulltrainReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-fulltrain-run3-scheduler-brev/v1"
      && recognizerRun3SchedulerFulltrainReceipt.status
        === "completed_improved_vs_run2_fail_closed_below_gate_worker_stopped"
      && recognizerRun3SchedulerFulltrainReceipt.slice
        === recognizerRun3SchedulerFulltrainNextAction
      && recognizerRun3SchedulerFulltrainReceipt.source_of_truth
        ?.scheduler_preflight_receipt === recognizerSchedulerPreflightReceiptPath
      && recognizerRun3SchedulerFulltrainReceipt.worker?.name
        === "asl-pilot-m3eh-l40s-001"
      && recognizerRun3SchedulerFulltrainReceipt.worker?.id === "3d58wpy9o"
      && recognizerRun3SchedulerFulltrainReceipt.worker?.gpu === "L40S"
      && recognizerRun3SchedulerFulltrainReceipt.worker?.preflight
        ?.cuda_available === true
      && recognizerRun3SchedulerFulltrainReceipt.worker?.preflight
        ?.cuda_device_name === "NVIDIA L40S"
      && recognizerRun3SchedulerFulltrainReceipt.worker?.preflight
        ?.active_training_process_found === false
      && recognizerRun3SchedulerFulltrainReceipt.worker?.teardown?.final_status
        === "STOPPED"
      && recognizerRun3SchedulerFulltrainReceipt.worker?.teardown
        ?.final_shell_status === "NOT READY"
      && recognizerRun3SchedulerFulltrainReceipt.worker?.teardown
        ?.final_health_status === "HEALTHY"
      && recognizerRun3SchedulerFulltrainReceipt.sync?.remote_hashes_after_sync
        ?.["train_recognizer_distill.py"]
        === "bfa4ed698da20561e3b3005f56467edec42161f0269e3fc57535c7701b392898"
      && recognizerRun3SchedulerFulltrainReceipt.sync?.remote_hashes_after_sync
        ?.["test_recognizer_distill_diagnostics.py"]
        === "6f9a4b282f1ee33d84174a4db17cfb1a902252fc751a96e4253b896e3a3e5942"
      && recognizerRun3SchedulerFulltrainReceipt.sync?.remote_hashes_after_sync
        ?.["seq_transformer.py"]
        === "0d57f8b567d4b5f801164ef3e5b8ca34406cffed05f37c138290674906923eea"
      && recognizerRun3SchedulerFulltrainReceipt.sync?.remote_hashes_after_sync
        ?.["verification.py"]
        === "f77659fa62300eb67f3eefc1b6a79fd9944d52a566f09fbec0cee33cc9914b29"
      && recognizerRun3SchedulerFulltrainReceipt.sync?.remote_hashes_after_sync
        ?.["test_verification.py"]
        === "0c4f3fdf3a95a5e93019187d52cacdb73fc364e27b621601a22af5d6d518a125"
      && recognizerRun3SchedulerFulltrainReceipt.remote_preflight
        ?.verification_test === "passed"
      && recognizerRun3SchedulerFulltrainReceipt.remote_preflight
        ?.diagnostics_test === "passed"
      && recognizerRun3SchedulerFulltrainReceipt.remote_preflight
        ?.seq_transformer_self_test === "passed"
      && recognizerRun3SchedulerFulltrainReceipt.remote_preflight
        ?.zero_epoch_full_data_no_save?.status === "passed"
      && recognizerRun3SchedulerFulltrainReceipt.remote_preflight
        ?.zero_epoch_full_data_no_save?.train_clips === 7011
      && recognizerRun3SchedulerFulltrainReceipt.remote_preflight
        ?.zero_epoch_full_data_no_save?.monitor_clips === 955
      && recognizerRun3SchedulerFulltrainReceipt.remote_preflight
        ?.zero_epoch_full_data_no_save?.test_clips === 2369
      && recognizerRun3SchedulerFulltrainReceipt.run?.completed === true
      && recognizerRun3SchedulerFulltrainReceipt.run?.no_limit_flags_used === true
      && recognizerRun3SchedulerFulltrainReceipt.run?.hyperparameters
        ?.student_arch === "transformer"
      && recognizerRun3SchedulerFulltrainReceipt.run?.hyperparameters?.epochs
        === 240
      && recognizerRun3SchedulerFulltrainReceipt.run?.hyperparameters?.batch
        === 128
      && recognizerRun3SchedulerFulltrainReceipt.run?.hyperparameters?.lr
        === 0.0005
      && recognizerRun3SchedulerFulltrainReceipt.run?.hyperparameters
        ?.lr_scheduler?.name === "cosine"
      && recognizerRun3SchedulerFulltrainReceipt.run?.hyperparameters
        ?.lr_scheduler?.warmup_steps === 500
      && recognizerRun3SchedulerFulltrainReceipt.run?.hyperparameters
        ?.lr_scheduler?.min_lr === 0.00005
      && recognizerRun3SchedulerFulltrainReceipt.run?.data?.train_clips === 7011
      && recognizerRun3SchedulerFulltrainReceipt.run?.data?.monitor_clips === 955
      && recognizerRun3SchedulerFulltrainReceipt.run?.data?.test_clips === 2369
      && recognizerRun3SchedulerFulltrainReceipt.run?.data?.classes === 95
      && recognizerRun3SchedulerFulltrainReceipt.run?.data
        ?.optimizer_steps === 13200
      && recognizerRun3SchedulerFulltrainReceipt.run?.data
        ?.expected_optimizer_steps === 13200
      && recognizerRun3SchedulerFulltrainReceipt.run?.lr_trace
        ?.first_epoch_lr_first === 0.000001
      && recognizerRun3SchedulerFulltrainReceipt.run?.lr_trace
        ?.first_epoch_lr_last === 0.000055
      && recognizerRun3SchedulerFulltrainReceipt.run?.lr_trace
        ?.last_epoch_lr_first === 0.0000500201
      && recognizerRun3SchedulerFulltrainReceipt.run?.lr_trace
        ?.last_epoch_lr_last === 0.00005
      && recognizerRun3SchedulerFulltrainReceipt.metrics?.test_top1 === 0.2984
      && recognizerRun3SchedulerFulltrainReceipt.metrics?.test_top5 === 0.6036
      && recognizerRun3SchedulerFulltrainReceipt.metrics
        ?.verification_recall_at_far10 === 0.7316
      && recognizerRun3SchedulerFulltrainReceipt.metrics?.monitor_best_epoch
        === 184
      && recognizerRun3SchedulerFulltrainReceipt.metrics?.monitor_best_top1
        === 0.378
      && recognizerRun3SchedulerFulltrainReceipt.metrics
        ?.delta_vs_run2_verification_recall_at_far10 === 0.0456
      && recognizerRun3SchedulerFulltrainReceipt.metrics
        ?.gap_to_gate_verification_recall_at_far10 === 0.1184
      && recognizerRun3SchedulerFulltrainReceipt.metrics?.decision
        === "improved_vs_run2_and_gru_recall_baseline_but_rejected_fail_closed_below_primary_gate"
      && exists(sideRecognizerRun3SchedulerReceiptPath)
      && exists(sideRecognizerRun3SchedulerWeightsPath)
      && exists(sideRecognizerRun3SchedulerLogPath)
      && recognizerRun3SchedulerFulltrainReceipt.artifacts
        ?.local_receipt_sha256 === sha256(sideRecognizerRun3SchedulerReceiptPath)
      && recognizerRun3SchedulerFulltrainReceipt.artifacts
        ?.local_weights_sha256 === sha256(sideRecognizerRun3SchedulerWeightsPath)
      && recognizerRun3SchedulerFulltrainReceipt.artifacts
        ?.local_log_sha256 === sha256(sideRecognizerRun3SchedulerLogPath)
      && recognizerRun3SchedulerFulltrainReceipt.artifacts
        ?.local_receipt_sha256
        === "bbdd8a16f2e0142b388dbcf5303db05c329ddbbf9ae9ddfea3b1181b4e7deca3"
      && recognizerRun3SchedulerFulltrainReceipt.artifacts
        ?.local_weights_sha256
        === "aaecd21c5bde0123d5aee84e65bc40ddbccc65c05ade75887569b92bb431d329"
      && recognizerRun3SchedulerFulltrainReceipt.artifacts?.local_log_sha256
        === "3e8fb213a2899c1376e0cdeb9b56942a8ad7785824db83c430543244555dd0a9"
      && recognizerRun3SchedulerFulltrainReceipt.runtime_boundary?.brev_used
        === true
      && recognizerRun3SchedulerFulltrainReceipt.runtime_boundary
        ?.training_run === true
      && recognizerRun3SchedulerFulltrainReceipt.runtime_boundary
        ?.checkpoint_written === true
      && recognizerRun3SchedulerFulltrainReceipt.runtime_boundary
        ?.worker_stopped_after_run === true
      && recognizerRun3SchedulerFulltrainReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && recognizerRun3SchedulerFulltrainReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && recognizerRun3SchedulerFulltrainReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun3SchedulerFulltrainReceipt.runtime_boundary
        ?.final_gate_changed === false
      && recognizerRun3SchedulerFulltrainReceipt.next_action?.token
        === recognizerRun3ResearchTuningNextAction,
    {
      path: recognizerRun3SchedulerFulltrainReceiptPath,
      status: recognizerRun3SchedulerFulltrainReceipt.status ?? null,
      worker: recognizerRun3SchedulerFulltrainReceipt.worker ?? null,
      run: recognizerRun3SchedulerFulltrainReceipt.run ?? null,
      metrics: recognizerRun3SchedulerFulltrainReceipt.metrics ?? null,
      artifacts: recognizerRun3SchedulerFulltrainReceipt.artifacts ?? null,
      runtime_boundary:
        recognizerRun3SchedulerFulltrainReceipt.runtime_boundary ?? null,
      next_action: recognizerRun3SchedulerFulltrainReceipt.next_action ?? null,
    },
    "recognizer run3 scheduler fulltrain must use full data/cosine schedule, improve run2 while remaining fail-closed below recall gate, copy back hashed artifacts, stop Brev, and select no-Brev research next",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run3_research_tuning_selects_t32_preflight_no_brev",
    recognizerRun3ResearchTuningReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run3-research-tuning/v1"
      && recognizerRun3ResearchTuningReceipt.status
        === "completed_research_tuning_no_brev_no_training"
      && recognizerRun3ResearchTuningReceipt.slice
        === recognizerRun3ResearchTuningNextAction
      && recognizerRun3ResearchTuningReceipt.inputs?.run3_receipt
        === recognizerRun3SchedulerFulltrainReceiptPath
      && recognizerRun3ResearchTuningReceipt.run3_summary
        ?.sequence_length === 20
      && recognizerRun3ResearchTuningReceipt.run3_summary?.train_clips === 7011
      && recognizerRun3ResearchTuningReceipt.run3_summary?.monitor_clips
        === 955
      && recognizerRun3ResearchTuningReceipt.run3_summary?.test_clips === 2369
      && recognizerRun3ResearchTuningReceipt.run3_summary?.feature_dim === 90
      && recognizerRun3ResearchTuningReceipt.run3_summary?.classes === 95
      && recognizerRun3ResearchTuningReceipt.run3_summary
        ?.verification_recall_at_far10 === 0.7316
      && recognizerRun3ResearchTuningReceipt.run3_summary?.test_top1 === 0.2984
      && recognizerRun3ResearchTuningReceipt.run3_summary?.test_top5 === 0.6036
      && recognizerRun3ResearchTuningReceipt.baseline_and_deltas
        ?.gap_to_gate_verification_recall_at_far10 === 0.1184
      && recognizerRun3ResearchTuningReceipt.trainer_surface
        ?.alpha_semantics_verified
      && Array.isArray(
        recognizerRun3ResearchTuningReceipt.trainer_surface
          ?.missing_for_selected_next_slice,
      )
      && recognizerRun3ResearchTuningReceipt.trainer_surface
        .missing_for_selected_next_slice.includes(
          "seq-len or cache-root CLI support for T=32 student cache selection/generation",
        )
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.attempted === true
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.status === "blocked_no_session_owned_iab_backend"
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.used === true
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.route === "openai-api-research"
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.model_requested === "gpt-5.5"
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.response_id
        === "resp_094a4bec0c49b901006a209838a95c8190b589131d97c225bf"
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.status === "completed"
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.model_returned === "gpt-5.5-2026-04-23"
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.total_tokens === 9860
      && exists(recognizerRun3ResearchTuningPromptFilePath)
      && exists(recognizerRun3ResearchTuningRequestFilePath)
      && exists(recognizerRun3ResearchTuningRawFilePath)
      && exists(recognizerRun3ResearchTuningResponseFilePath)
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.prompt_md
        === sha256(recognizerRun3ResearchTuningPromptFilePath)
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.request_json
        === sha256(recognizerRun3ResearchTuningRequestFilePath)
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.raw_json
        === sha256(recognizerRun3ResearchTuningRawFilePath)
      && recognizerRun3ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.response_md
        === sha256(recognizerRun3ResearchTuningResponseFilePath)
      && recognizerRun3ResearchTuningReceipt.research_conclusion
        ?.selected_next_action === recognizerT32CacheLoaderPreflightNextAction
      && recognizerRun3ResearchTuningReceipt.research_conclusion
        ?.run4_recipe_if_preflight_passes?.sequence_length === 32
      && recognizerRun3ResearchTuningReceipt.research_conclusion
        ?.run4_recipe_if_preflight_passes?.d_model === 256
      && recognizerRun3ResearchTuningReceipt.research_conclusion
        ?.run4_recipe_if_preflight_passes?.n_layers === 6
      && recognizerRun3ResearchTuningReceipt.research_conclusion
        ?.run4_recipe_if_preflight_passes?.n_heads === 8
      && recognizerRun3ResearchTuningReceipt.research_conclusion
        ?.run4_recipe_if_preflight_passes?.batch === 128
      && recognizerRun3ResearchTuningReceipt.research_conclusion
        ?.run4_recipe_if_preflight_passes?.epochs === 240
      && recognizerRun3ResearchTuningReceipt.research_conclusion
        ?.run4_recipe_if_preflight_passes?.alpha === 0.55
      && recognizerRun3ResearchTuningReceipt.research_conclusion
        ?.run4_recipe_if_preflight_passes?.expected_change_vs_run3
        ?.includes("Only the audited T=32 student cache/window changes")
      && recognizerRun3ResearchTuningReceipt.boundaries?.brev_used === false
      && recognizerRun3ResearchTuningReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun3ResearchTuningReceipt.boundaries?.training_run === false
      && recognizerRun3ResearchTuningReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun3ResearchTuningReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun3ResearchTuningReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRun3ResearchTuningReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun3ResearchTuningReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun3ResearchTuningReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerRun3ResearchTuningReceipt.next_action?.token
        === recognizerT32CacheLoaderPreflightNextAction,
    {
      path: recognizerRun3ResearchTuningReceiptPath,
      status: recognizerRun3ResearchTuningReceipt.status ?? null,
      run3_summary: recognizerRun3ResearchTuningReceipt.run3_summary ?? null,
      trainer_surface: recognizerRun3ResearchTuningReceipt.trainer_surface ?? null,
      research_escalation:
        recognizerRun3ResearchTuningReceipt.research_escalation ?? null,
      research_conclusion:
        recognizerRun3ResearchTuningReceipt.research_conclusion ?? null,
      boundaries: recognizerRun3ResearchTuningReceipt.boundaries ?? null,
      next_action: recognizerRun3ResearchTuningReceipt.next_action ?? null,
    },
    "recognizer run3 research tuning must record GPT-Pro browser block, gpt-5.5 API fallback, artifact hashes, selected T=32 local preflight, unchanged run4 hyperparameters except sequence length, and no Brev/training boundary",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_t32_cache_loader_preflight_passed_no_brev_no_training",
    recognizerT32CacheLoaderPreflightReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-t32-cache-loader-preflight/v1"
      && recognizerT32CacheLoaderPreflightReceipt.status
        === "passed_loader_support_preflight_no_brev_no_training"
      && recognizerT32CacheLoaderPreflightReceipt.slice
        === recognizerT32CacheLoaderPreflightNextAction
      && recognizerT32CacheLoaderPreflightReceipt.source_of_truth
        ?.run3_research_tuning_receipt === recognizerRun3ResearchTuningReceiptPath
      && recognizerT32CacheLoaderPreflightReceipt.side_worktree?.code_commit
        === "46cd3ddf69fd8bf2e1cf17523f4217f335c8cd6d"
      && recognizerT32CacheLoaderPreflightReceipt.side_worktree?.trainer_path
        === sideRecognizerTrainerPath
      && recognizerT32CacheLoaderPreflightReceipt.side_worktree?.trainer_sha256
        === "a45f3294a7d227beacf069638bf0589c66c3d960ad87d1b912ced17ceeec1186"
      && recognizerT32CacheLoaderPreflightReceipt.side_worktree
        ?.diagnostics_test_path === sideRecognizerDiagnosticsTestPath
      && recognizerT32CacheLoaderPreflightReceipt.side_worktree
        ?.diagnostics_test_sha256
        === "e49d65005fa7d8e51fb95a3e47121fab5f7afabd7b705599cf9c11210561bf6c"
      && Array.isArray(
        recognizerT32CacheLoaderPreflightReceipt.implementation
          ?.trainer_flags_added,
      )
      && recognizerT32CacheLoaderPreflightReceipt.implementation
        .trainer_flags_added.includes("--seq-len")
      && recognizerT32CacheLoaderPreflightReceipt.implementation
        .trainer_flags_added.includes("--dry-run-forward")
      && recognizerT32CacheLoaderPreflightReceipt.implementation
        ?.student_data_selector_preserved === true
      && recognizerT32CacheLoaderPreflightReceipt.implementation
        ?.distillation_loss_shared_with_training_path === true
      && recognizerT32CacheLoaderPreflightReceipt.local_preflight
        ?.negative_t32_guard?.status === "failed_as_expected"
      && String(
        recognizerT32CacheLoaderPreflightReceipt.local_preflight
          ?.negative_t32_guard?.stderr_excerpt ?? "",
      ).includes("expected sequence length 32 but loaded T 20")
      && recognizerT32CacheLoaderPreflightReceipt.local_preflight
        ?.positive_current_t20_dryrun?.receipt_path
        === recognizerT32LoaderDryrunReceiptPath
      && recognizerT32CacheLoaderPreflightReceipt.local_preflight
        ?.positive_current_t20_dryrun?.receipt_sha256
        === sha256(recognizerT32LoaderDryrunReceiptFilePath)
      && recognizerT32LoaderDryrunReceipt.training_mode === "dry_run_forward"
      && recognizerT32LoaderDryrunReceipt.student_cache?.sequence_length === 20
      && recognizerT32LoaderDryrunReceipt.student_cache?.feature_dim === 90
      && recognizerT32LoaderDryrunReceipt.student_cache?.clips === 10335
      && recognizerT32LoaderDryrunReceipt.dry_run_forward?.logits_shape?.[0] === 4
      && recognizerT32LoaderDryrunReceipt.dry_run_forward?.logits_shape?.[1] === 95
      && recognizerT32LoaderDryrunReceipt.dry_run_forward
        ?.optimizer_constructed === false
      && recognizerT32LoaderDryrunReceipt.dry_run_forward
        ?.backward_called === false
      && recognizerT32LoaderDryrunReceipt.optimizer_steps === 0
      && recognizerT32LoaderDryrunReceipt.expected_optimizer_steps === 0
      && recognizerT32LoaderDryrunReceipt.weights === null
      && recognizerT32CacheLoaderPreflightReceipt.cache_inventory
        ?.existing_t32_cache_found === false
      && recognizerT32CacheLoaderPreflightReceipt.runtime_boundary
        ?.brev_used === false
      && recognizerT32CacheLoaderPreflightReceipt.runtime_boundary
        ?.brev_lifecycle_or_exec === false
      && recognizerT32CacheLoaderPreflightReceipt.runtime_boundary
        ?.training_run === false
      && recognizerT32CacheLoaderPreflightReceipt.runtime_boundary
        ?.optimizer_or_backward_step === false
      && recognizerT32CacheLoaderPreflightReceipt.runtime_boundary
        ?.checkpoint_written === false
      && recognizerT32CacheLoaderPreflightReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && recognizerT32CacheLoaderPreflightReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && recognizerT32CacheLoaderPreflightReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && recognizerT32CacheLoaderPreflightReceipt.runtime_boundary
        ?.final_gate_changed === false
      && recognizerT32CacheLoaderPreflightReceipt.next_action?.token
        === recognizerT32CacheMaterializeNextAction,
    {
      path: recognizerT32CacheLoaderPreflightReceiptPath,
      status: recognizerT32CacheLoaderPreflightReceipt.status ?? null,
      side_worktree:
        recognizerT32CacheLoaderPreflightReceipt.side_worktree ?? null,
      implementation:
        recognizerT32CacheLoaderPreflightReceipt.implementation ?? null,
      local_preflight:
        recognizerT32CacheLoaderPreflightReceipt.local_preflight ?? null,
      dryrun_receipt: {
        path: recognizerT32LoaderDryrunReceiptPath,
        training_mode: recognizerT32LoaderDryrunReceipt.training_mode ?? null,
        student_cache: recognizerT32LoaderDryrunReceipt.student_cache ?? null,
        dry_run_forward:
          recognizerT32LoaderDryrunReceipt.dry_run_forward ?? null,
        optimizer_steps: recognizerT32LoaderDryrunReceipt.optimizer_steps ?? null,
        expected_optimizer_steps:
          recognizerT32LoaderDryrunReceipt.expected_optimizer_steps ?? null,
        weights: recognizerT32LoaderDryrunReceipt.weights ?? null,
      },
      cache_inventory:
        recognizerT32CacheLoaderPreflightReceipt.cache_inventory ?? null,
      runtime_boundary:
        recognizerT32CacheLoaderPreflightReceipt.runtime_boundary ?? null,
      next_action: recognizerT32CacheLoaderPreflightReceipt.next_action ?? null,
    },
    "recognizer T=32 loader preflight must add seq-len/dry-run support, prove the current T=20 cache fails a T=32 guard, dry-run one current-cache forward with zero optimizer/backward/checkpoint, and select local T=32 cache materialization next",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_t32_cache_smoke_materialized_and_dryrun_validated_no_brev",
    recognizerT32CacheSmokeValidateReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-t32-cache-smoke-validate/v1"
      && recognizerT32CacheSmokeValidateReceipt.status
        === "passed_t32_smoke_cache_materialized_and_loader_validated_no_brev"
      && recognizerT32CacheSmokeValidateReceipt.slice
        === recognizerT32CacheMaterializeNextAction
      && recognizerT32CacheSmokeValidateReceipt.source_of_truth
        ?.loader_preflight_receipt === recognizerT32CacheLoaderPreflightReceiptPath
      && recognizerT32CacheSmokeValidateReceipt.cache?.rows_path
        === sideRecognizerT32SmokeRowsPath
      && exists(sideRecognizerT32SmokeRowsPath)
      && recognizerT32CacheSmokeValidateReceipt.cache?.rows_sha256
        === sha256(sideRecognizerT32SmokeRowsPath)
      && recognizerT32CacheSmokeValidateReceipt.cache?.frames_per_clip === 32
      && recognizerT32CacheSmokeValidateReceipt.cache?.rows === 9120
      && recognizerT32CacheSmokeValidateReceipt.cache?.clips === 285
      && recognizerT32CacheSmokeValidateReceipt.cache?.missing === 0
      && recognizerT32CacheSmokeValidateReceipt.cache?.label_count === 95
      && recognizerT32CacheSmokeValidateReceipt.cache?.split_counts?.train === 95
      && recognizerT32CacheSmokeValidateReceipt.cache?.split_counts?.validation
        === 95
      && recognizerT32CacheSmokeValidateReceipt.cache?.split_counts?.test === 95
      && recognizerT32CacheSmokeValidateReceipt.cache?.frame_counts?.["32"]
        === 285
      && recognizerT32CacheSmokeValidateReceipt.dryrun
        ?.receipt_path === recognizerT32CacheSmokeDryrunReceiptPath
      && recognizerT32CacheSmokeValidateReceipt.dryrun
        ?.receipt_sha256 === sha256(recognizerT32CacheSmokeDryrunReceiptFilePath)
      && recognizerT32CacheSmokeDryrunReceipt.training_mode === "dry_run_forward"
      && recognizerT32CacheSmokeDryrunReceipt.student_cache?.sequence_length
        === 32
      && recognizerT32CacheSmokeDryrunReceipt.student_cache?.clips === 285
      && recognizerT32CacheSmokeDryrunReceipt.student_cache?.classes === 95
      && recognizerT32CacheSmokeDryrunReceipt.student_cache?.feature_dim === 90
      && recognizerT32CacheSmokeDryrunReceipt.dry_run_forward
        ?.logits_shape?.[0] === 8
      && recognizerT32CacheSmokeDryrunReceipt.dry_run_forward
        ?.logits_shape?.[1] === 95
      && recognizerT32CacheSmokeDryrunReceipt.dry_run_forward
        ?.optimizer_constructed === false
      && recognizerT32CacheSmokeDryrunReceipt.dry_run_forward
        ?.backward_called === false
      && recognizerT32CacheSmokeDryrunReceipt.optimizer_steps === 0
      && recognizerT32CacheSmokeDryrunReceipt.expected_optimizer_steps === 0
      && recognizerT32CacheSmokeDryrunReceipt.weights === null
      && recognizerT32CacheSmokeValidateReceipt.runtime_boundary
        ?.brev_used === false
      && recognizerT32CacheSmokeValidateReceipt.runtime_boundary
        ?.brev_lifecycle_or_exec === false
      && recognizerT32CacheSmokeValidateReceipt.runtime_boundary
        ?.training_run === false
      && recognizerT32CacheSmokeValidateReceipt.runtime_boundary
        ?.optimizer_or_backward_step === false
      && recognizerT32CacheSmokeValidateReceipt.runtime_boundary
        ?.checkpoint_written === false
      && recognizerT32CacheSmokeValidateReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && recognizerT32CacheSmokeValidateReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && recognizerT32CacheSmokeValidateReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && recognizerT32CacheSmokeValidateReceipt.runtime_boundary
        ?.final_gate_changed === false
      && recognizerT32CacheSmokeValidateReceipt.next_action?.token
        === recognizerT32FullCacheMaterializeNextAction,
    {
      path: recognizerT32CacheSmokeValidateReceiptPath,
      status: recognizerT32CacheSmokeValidateReceipt.status ?? null,
      cache: recognizerT32CacheSmokeValidateReceipt.cache ?? null,
      dryrun: {
        path: recognizerT32CacheSmokeDryrunReceiptPath,
        training_mode:
          recognizerT32CacheSmokeDryrunReceipt.training_mode ?? null,
        student_cache:
          recognizerT32CacheSmokeDryrunReceipt.student_cache ?? null,
        dry_run_forward:
          recognizerT32CacheSmokeDryrunReceipt.dry_run_forward ?? null,
        optimizer_steps:
          recognizerT32CacheSmokeDryrunReceipt.optimizer_steps ?? null,
        expected_optimizer_steps:
          recognizerT32CacheSmokeDryrunReceipt.expected_optimizer_steps ?? null,
        weights: recognizerT32CacheSmokeDryrunReceipt.weights ?? null,
      },
      runtime_boundary:
        recognizerT32CacheSmokeValidateReceipt.runtime_boundary ?? null,
      next_action: recognizerT32CacheSmokeValidateReceipt.next_action ?? null,
    },
    "recognizer T=32 smoke cache validation must materialize all-label T=32 rows locally, hash-match the side cache, dry-run the Transformer loader with zero optimizer/backward/checkpoint, and select full T=32 cache materialization next",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_t32_full_cache_materialized_and_dryrun_validated_no_brev",
    recognizerT32FullCacheValidateReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-t32-full-cache-validate/v1"
      && recognizerT32FullCacheValidateReceipt.status
        === "passed_t32_full_cache_materialized_and_loader_validated_no_brev"
      && recognizerT32FullCacheValidateReceipt.slice
        === recognizerT32FullCacheMaterializeNextAction
      && recognizerT32FullCacheValidateReceipt.source_of_truth
        ?.smoke_cache_receipt === recognizerT32CacheSmokeValidateReceiptPath
      && recognizerT32FullCacheValidateReceipt.cache?.rows_path
        === sideRecognizerT32FullRowsPath
      && exists(sideRecognizerT32FullRowsPath)
      && recognizerT32FullCacheValidateReceipt.cache?.rows_sha256
        === sha256(sideRecognizerT32FullRowsPath)
      && recognizerT32FullCacheValidateReceipt.cache?.landmark_model
        === "detector0-hand-landmarks-merged-w64.pt"
      && recognizerT32FullCacheValidateReceipt.cache?.frames_per_clip === 32
      && recognizerT32FullCacheValidateReceipt.cache?.rows === 330309
      && recognizerT32FullCacheValidateReceipt.cache?.clips === 10335
      && recognizerT32FullCacheValidateReceipt.cache?.missing === 0
      && recognizerT32FullCacheValidateReceipt.cache?.label_count === 95
      && recognizerT32FullCacheValidateReceipt.cache?.split_counts?.train === 5591
      && recognizerT32FullCacheValidateReceipt.cache?.split_counts?.validation
        === 2375
      && recognizerT32FullCacheValidateReceipt.cache?.split_counts?.test === 2369
      && recognizerT32FullCacheValidateReceipt.cache?.source_clips?.popsign
        === 7119
      && recognizerT32FullCacheValidateReceipt.cache?.source_clips?.asl_citizen
        === 3216
      && recognizerT32FullCacheValidateReceipt.cache?.frame_counts?.["32"]
        === 10274
      && recognizerT32FullCacheValidateReceipt.dryrun
        ?.receipt_path === recognizerT32FullCacheDryrunReceiptPath
      && recognizerT32FullCacheValidateReceipt.dryrun
        ?.receipt_sha256 === sha256(recognizerT32FullCacheDryrunReceiptFilePath)
      && recognizerT32FullCacheDryrunReceipt.training_mode === "dry_run_forward"
      && recognizerT32FullCacheDryrunReceipt.student_cache?.sequence_length
        === 32
      && recognizerT32FullCacheDryrunReceipt.student_cache
        ?.tensor_sequence_length === 32
      && recognizerT32FullCacheDryrunReceipt.student_cache?.clips === 10335
      && recognizerT32FullCacheDryrunReceipt.student_cache?.classes === 95
      && recognizerT32FullCacheDryrunReceipt.student_cache?.feature_dim === 90
      && recognizerT32FullCacheDryrunReceipt.student_cache?.length_min === 15
      && recognizerT32FullCacheDryrunReceipt.student_cache?.length_max === 32
      && recognizerT32FullCacheDryrunReceipt.train_clips === 7011
      && recognizerT32FullCacheDryrunReceipt.monitor_clips === 955
      && recognizerT32FullCacheDryrunReceipt.test_clips === 2369
      && recognizerT32FullCacheDryrunReceipt.steps_per_epoch === 55
      && recognizerT32FullCacheDryrunReceipt.planned_optimizer_steps === 13200
      && recognizerT32FullCacheDryrunReceipt.dry_run_forward
        ?.logits_shape?.[0] === 128
      && recognizerT32FullCacheDryrunReceipt.dry_run_forward
        ?.logits_shape?.[1] === 95
      && recognizerT32FullCacheDryrunReceipt.dry_run_forward
        ?.optimizer_constructed === false
      && recognizerT32FullCacheDryrunReceipt.dry_run_forward
        ?.backward_called === false
      && recognizerT32FullCacheDryrunReceipt.optimizer_steps === 0
      && recognizerT32FullCacheDryrunReceipt.expected_optimizer_steps === 0
      && recognizerT32FullCacheDryrunReceipt.weights === null
      && recognizerT32FullCacheValidateReceipt.run4_envelope?.next_action
        === recognizerRun4T32FulltrainNextAction
      && recognizerT32FullCacheValidateReceipt.run4_envelope
        ?.expected_counts?.sequence_length === 32
      && recognizerT32FullCacheValidateReceipt.run4_envelope
        ?.expected_counts?.expected_optimizer_steps === 13200
      && recognizerT32FullCacheValidateReceipt.runtime_boundary
        ?.brev_used === false
      && recognizerT32FullCacheValidateReceipt.runtime_boundary
        ?.brev_lifecycle_or_exec === false
      && recognizerT32FullCacheValidateReceipt.runtime_boundary
        ?.training_run === false
      && recognizerT32FullCacheValidateReceipt.runtime_boundary
        ?.optimizer_or_backward_step === false
      && recognizerT32FullCacheValidateReceipt.runtime_boundary
        ?.checkpoint_written === false
      && recognizerT32FullCacheValidateReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && recognizerT32FullCacheValidateReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && recognizerT32FullCacheValidateReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && recognizerT32FullCacheValidateReceipt.runtime_boundary
        ?.final_gate_changed === false
      && recognizerT32FullCacheValidateReceipt.next_action?.token
        === recognizerRun4T32FulltrainNextAction,
    {
      path: recognizerT32FullCacheValidateReceiptPath,
      status: recognizerT32FullCacheValidateReceipt.status ?? null,
      cache: recognizerT32FullCacheValidateReceipt.cache ?? null,
      dryrun: {
        path: recognizerT32FullCacheDryrunReceiptPath,
        training_mode:
          recognizerT32FullCacheDryrunReceipt.training_mode ?? null,
        student_cache:
          recognizerT32FullCacheDryrunReceipt.student_cache ?? null,
        dry_run_forward:
          recognizerT32FullCacheDryrunReceipt.dry_run_forward ?? null,
        optimizer_steps:
          recognizerT32FullCacheDryrunReceipt.optimizer_steps ?? null,
        expected_optimizer_steps:
          recognizerT32FullCacheDryrunReceipt.expected_optimizer_steps ?? null,
        planned_optimizer_steps:
          recognizerT32FullCacheDryrunReceipt.planned_optimizer_steps ?? null,
        weights: recognizerT32FullCacheDryrunReceipt.weights ?? null,
      },
      run4_envelope:
        recognizerT32FullCacheValidateReceipt.run4_envelope ?? null,
      runtime_boundary:
        recognizerT32FullCacheValidateReceipt.runtime_boundary ?? null,
      next_action: recognizerT32FullCacheValidateReceipt.next_action ?? null,
    },
    "recognizer full T=32 cache validation must materialize the full run4 cache locally, hash-match the side cache, dry-run the Transformer loader with zero optimizer/backward/checkpoint, and select approved T=32 run4 training next",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run4_t32_brev_preflight_blocked_before_sync_or_training",
    recognizerRun4T32PreflightBlockerReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run4-t32-brev-preflight-blocker/v1"
      && recognizerRun4T32PreflightBlockerReceipt.status
        === "blocked_before_remote_sync_or_training_worker_ssh_unavailable_worker_stopped_unhealthy"
      && recognizerRun4T32PreflightBlockerReceipt.slice
        === recognizerRun4T32FulltrainNextAction
      && recognizerRun4T32PreflightBlockerReceipt.source_of_truth
        ?.t32_full_cache_receipt === recognizerT32FullCacheValidateReceiptPath
      && recognizerRun4T32PreflightBlockerReceipt.worker?.initial_brev_ls
        ?.retained?.status === "STOPPED"
      && recognizerRun4T32PreflightBlockerReceipt.worker?.after_start_brev_ls
        ?.retained?.status === "RUNNING"
      && recognizerRun4T32PreflightBlockerReceipt.worker?.remote_preflight
        ?.exit_code === 124
      && recognizerRun4T32PreflightBlockerReceipt.worker?.remote_preflight
        ?.ssh_available === false
      && recognizerRun4T32PreflightBlockerReceipt.worker?.final_brev_ls
        ?.retained?.status === "STOPPED"
      && recognizerRun4T32PreflightBlockerReceipt.worker?.final_brev_ls
        ?.retained?.shell_status === "NOT READY"
      && recognizerRun4T32PreflightBlockerReceipt.worker?.final_brev_ls
        ?.retained?.health_status === "UNHEALTHY"
      && recognizerRun4T32PreflightBlockerReceipt.local_hashes
        ?.["train_recognizer_distill.py"]
        === "a45f3294a7d227beacf069638bf0589c66c3d960ad87d1b912ced17ceeec1186"
      && recognizerRun4T32PreflightBlockerReceipt.local_hashes
        ?.[".cache/recog-seq-w64-t32-merged-v1/rows.json"]
          === sha256(sideRecognizerT32FullRowsPath)
      && recognizerRun4T32PreflightBlockerReceipt.sync
        ?.remote_sync_attempted === false
      && recognizerRun4T32PreflightBlockerReceipt.run
        ?.training_launched === false
      && recognizerRun4T32PreflightBlockerReceipt.runtime_boundary
        ?.brev_used === true
      && recognizerRun4T32PreflightBlockerReceipt.runtime_boundary
        ?.remote_sync_attempted === false
      && recognizerRun4T32PreflightBlockerReceipt.runtime_boundary
        ?.training_run === false
      && recognizerRun4T32PreflightBlockerReceipt.runtime_boundary
        ?.optimizer_or_backward_step === false
      && recognizerRun4T32PreflightBlockerReceipt.runtime_boundary
        ?.checkpoint_written === false
      && recognizerRun4T32PreflightBlockerReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && recognizerRun4T32PreflightBlockerReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && recognizerRun4T32PreflightBlockerReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun4T32PreflightBlockerReceipt.runtime_boundary
        ?.final_gate_changed === false
      && recognizerRun4T32PreflightBlockerReceipt.next_action?.token
        === recognizerRun4T32WaitForHealthyWorkerNextAction,
    {
      path: recognizerRun4T32PreflightBlockerReceiptPath,
      status: recognizerRun4T32PreflightBlockerReceipt.status ?? null,
      worker: recognizerRun4T32PreflightBlockerReceipt.worker ?? null,
      local_hashes: recognizerRun4T32PreflightBlockerReceipt.local_hashes ?? null,
      sync: recognizerRun4T32PreflightBlockerReceipt.sync ?? null,
      run: recognizerRun4T32PreflightBlockerReceipt.run ?? null,
      runtime_boundary:
        recognizerRun4T32PreflightBlockerReceipt.runtime_boundary ?? null,
      next_action: recognizerRun4T32PreflightBlockerReceipt.next_action ?? null,
    },
    "recognizer run4 T=32 Brev preflight blocker must stop before remote sync/training when SSH is unavailable, verify the worker stopped unhealthy, and select wait-for-healthy-worker-or-infra-approval next",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run4_t32_brev_health_refresh_state_changed_no_spend",
    recognizerRun4T32HealthRefreshReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run4-t32-brev-health-refresh/v1"
      && recognizerRun4T32HealthRefreshReceipt.status
        === "state_changed_existing_retained_worker_healthy_no_spend"
      && recognizerRun4T32HealthRefreshReceipt.slice
        === recognizerRun4T32WaitForHealthyWorkerNextAction
      && recognizerRun4T32HealthRefreshReceipt.source_of_truth
        ?.previous_blocker_receipt === recognizerRun4T32PreflightBlockerReceiptPath
      && recognizerRun4T32HealthRefreshReceipt.initial_brev_ls
        ?.healthy_existing_nvidia_worker_available === false
      && recognizerRun4T32HealthRefreshReceipt.initial_brev_ls
        ?.retained_worker?.status === "STOPPED"
      && recognizerRun4T32HealthRefreshReceipt.initial_brev_ls
        ?.retained_worker?.shell_status === "NOT READY"
      && recognizerRun4T32HealthRefreshReceipt.initial_brev_ls
        ?.retained_worker?.health_status === "UNHEALTHY"
      && recognizerRun4T32HealthRefreshReceipt.final_read_only_brev_ls
        ?.healthy_existing_nvidia_worker_available === true
      && recognizerRun4T32HealthRefreshReceipt.final_read_only_brev_ls
        ?.retained_worker?.status === "RUNNING"
      && recognizerRun4T32HealthRefreshReceipt.final_read_only_brev_ls
        ?.retained_worker?.shell_status === "READY"
      && recognizerRun4T32HealthRefreshReceipt.final_read_only_brev_ls
        ?.retained_worker?.health_status === "HEALTHY"
      && recognizerRun4T32HealthRefreshReceipt.decision
        ?.initial_run4_retry_allowed === false
      && recognizerRun4T32HealthRefreshReceipt.decision
        ?.run4_retry_allowed_now === "requires_ssh_cuda_process_preflight_first"
      && recognizerRun4T32HealthRefreshReceipt.runtime_boundary
        ?.brev_read_only_visibility === true
      && recognizerRun4T32HealthRefreshReceipt.runtime_boundary
        ?.brev_lifecycle_or_exec === false
      && recognizerRun4T32HealthRefreshReceipt.runtime_boundary
        ?.training_run === false
      && recognizerRun4T32HealthRefreshReceipt.runtime_boundary
        ?.checkpoint_written === false
      && recognizerRun4T32HealthRefreshReceipt.runtime_boundary
        ?.final_gate_changed === false
      && recognizerRun4T32HealthRefreshReceipt.next_action?.token
        === recognizerRun4T32WaitForHealthyWorkerNextAction,
    {
      path: recognizerRun4T32HealthRefreshReceiptPath,
      status: recognizerRun4T32HealthRefreshReceipt.status ?? null,
      initial_brev_ls:
        recognizerRun4T32HealthRefreshReceipt.initial_brev_ls ?? null,
      final_read_only_brev_ls:
        recognizerRun4T32HealthRefreshReceipt.final_read_only_brev_ls ?? null,
      decision: recognizerRun4T32HealthRefreshReceipt.decision ?? null,
      runtime_boundary:
        recognizerRun4T32HealthRefreshReceipt.runtime_boundary ?? null,
      next_action: recognizerRun4T32HealthRefreshReceipt.next_action ?? null,
    },
    "recognizer run4 T=32 read-only Brev health refresh must record initial no-healthy inventory, final recovered retained worker, no lifecycle/exec/training/checkpoint/final-gate change, and keep wait-for-healthy-worker-or-infra-approval next",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run4_t32_fulltrain_improved_below_gate",
    recognizerRun4T32FulltrainReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-fulltrain-run4-t32-brev/v1"
      && recognizerRun4T32FulltrainReceipt.status
        === "completed_improved_running_best_rejected_fail_closed_below_gate"
      && recognizerRun4T32FulltrainReceipt.slice
        === recognizerRun4T32FulltrainNextAction
      && recognizerRun4T32FulltrainReceipt.source_of_truth
        ?.previous_health_receipt === recognizerRun4T32HealthRefreshReceiptPath
      && recognizerRun4T32FulltrainReceipt.source_of_truth
        ?.t32_full_cache_receipt === recognizerT32FullCacheValidateReceiptPath
      && recognizerRun4T32FulltrainReceipt.worker?.name
        === "asl-pilot-m3eh-l40s-001"
      && recognizerRun4T32FulltrainReceipt.worker?.preflight
        ?.cuda_available === true
      && recognizerRun4T32FulltrainReceipt.sync?.remote_hashes
        ?.["train_recognizer_distill.py"]
        === "a45f3294a7d227beacf069638bf0589c66c3d960ad87d1b912ced17ceeec1186"
      && recognizerRun4T32FulltrainReceipt.sync?.remote_hashes
        ?.[".cache/recog-seq-w64-t32-merged-v1/rows.json"]
          === sha256(sideRecognizerT32FullRowsPath)
      && recognizerRun4T32FulltrainReceipt.dryrun?.optimizer_steps === 0
      && recognizerRun4T32FulltrainReceipt.dryrun?.expected_optimizer_steps === 0
      && recognizerRun4T32FulltrainReceipt.dryrun?.student_cache?.sequence_length
        === 32
      && recognizerRun4T32FulltrainReceipt.run?.training_launched === true
      && recognizerRun4T32FulltrainReceipt.run?.no_limit_flags === true
      && recognizerRun4T32FulltrainReceipt.run?.epochs === 240
      && recognizerRun4T32FulltrainReceipt.run?.batch === 128
      && recognizerRun4T32FulltrainReceipt.run?.optimizer_steps === 13200
      && recognizerRun4T32FulltrainReceipt.run?.expected_optimizer_steps === 13200
      && recognizerRun4T32FulltrainReceipt.metrics?.verification_recall_at_far10
        === 0.7626
      && recognizerRun4T32FulltrainReceipt.metrics?.test_top1 === 0.3132
      && recognizerRun4T32FulltrainReceipt.metrics?.test_top5 === 0.6214
      && recognizerRun4T32FulltrainReceipt.metrics?.beats_run3_recall === true
      && recognizerRun4T32FulltrainReceipt.metrics?.passes_primary_gate === false
      && recognizerRun4T32FulltrainReceipt.artifacts?.local_hashes?.json
        === sha256(sideRecognizerRun4T32FulltrainReceiptPath)
      && recognizerRun4T32FulltrainReceipt.artifacts?.local_hashes?.checkpoint
        === sha256(sideRecognizerRun4T32FulltrainWeightsPath)
      && recognizerRun4T32FulltrainReceipt.artifacts?.local_hashes?.log
        === sha256(sideRecognizerRun4T32FulltrainLogPath)
      && recognizerRun4T32FulltrainReceipt.artifacts?.local_hashes?.pretrain_dryrun
        === sha256(sideRecognizerRun4T32PretrainDryrunPath)
      && recognizerRun4T32FulltrainReceipt.worker?.final_brev_ls
        ?.retained?.status === "STOPPED"
      && recognizerRun4T32FulltrainReceipt.worker?.final_brev_ls
        ?.retained?.shell_status === "NOT READY"
      && recognizerRun4T32FulltrainReceipt.worker?.final_brev_ls
        ?.retained?.health_status === "HEALTHY"
      && recognizerRun4T32FulltrainReceipt.runtime_boundary?.brev_used === true
      && recognizerRun4T32FulltrainReceipt.runtime_boundary?.training_run === true
      && recognizerRun4T32FulltrainReceipt.runtime_boundary
        ?.optimizer_or_backward_step === true
      && recognizerRun4T32FulltrainReceipt.runtime_boundary?.checkpoint_written
        === true
      && recognizerRun4T32FulltrainReceipt.runtime_boundary?.artifacts_copied_back
        === true
      && recognizerRun4T32FulltrainReceipt.runtime_boundary?.worker_stopped_after_run
        === true
      && recognizerRun4T32FulltrainReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && recognizerRun4T32FulltrainReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && recognizerRun4T32FulltrainReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun4T32FulltrainReceipt.runtime_boundary?.final_gate_changed
        === false
      && recognizerRun4T32FulltrainReceipt.next_action?.token
        === recognizerRun4ResearchTuningNextAction,
    {
      path: recognizerRun4T32FulltrainReceiptPath,
      status: recognizerRun4T32FulltrainReceipt.status ?? null,
      worker: recognizerRun4T32FulltrainReceipt.worker ?? null,
      sync: recognizerRun4T32FulltrainReceipt.sync ?? null,
      dryrun: recognizerRun4T32FulltrainReceipt.dryrun ?? null,
      run: recognizerRun4T32FulltrainReceipt.run ?? null,
      metrics: recognizerRun4T32FulltrainReceipt.metrics ?? null,
      artifacts: recognizerRun4T32FulltrainReceipt.artifacts ?? null,
      runtime_boundary:
        recognizerRun4T32FulltrainReceipt.runtime_boundary ?? null,
      next_action: recognizerRun4T32FulltrainReceipt.next_action ?? null,
    },
    "recognizer run4 T=32 Brev fulltrain must record verified sync, CUDA dry-run, full 13200-step run, improved-but-below-gate metrics, copied artifact hashes, stopped worker, and research-tuning next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run4_research_tuning_selects_supcon_preflight_no_brev",
    recognizerRun4ResearchTuningReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run4-research-tuning/v1"
      && recognizerRun4ResearchTuningReceipt.status
        === "completed_research_tuning_no_brev_no_training"
      && recognizerRun4ResearchTuningReceipt.slice
        === recognizerRun4ResearchTuningNextAction
      && recognizerRun4ResearchTuningReceipt.inputs?.run4_receipt
        === recognizerRun4T32FulltrainReceiptPath
      && recognizerRun4ResearchTuningReceipt.run4_summary?.sequence_length
        === 32
      && recognizerRun4ResearchTuningReceipt.run4_summary?.train_clips === 7011
      && recognizerRun4ResearchTuningReceipt.run4_summary?.monitor_clips
        === 955
      && recognizerRun4ResearchTuningReceipt.run4_summary?.test_clips === 2369
      && recognizerRun4ResearchTuningReceipt.run4_summary?.feature_dim === 90
      && recognizerRun4ResearchTuningReceipt.run4_summary?.classes === 95
      && recognizerRun4ResearchTuningReceipt.run4_summary
        ?.verification_recall_at_far10 === 0.7626
      && recognizerRun4ResearchTuningReceipt.run4_summary?.test_top1 === 0.3132
      && recognizerRun4ResearchTuningReceipt.run4_summary?.test_top5 === 0.6214
      && recognizerRun4ResearchTuningReceipt.baseline_and_deltas
        ?.delta_vs_run3_verification_recall_at_far10 === 0.031
      && recognizerRun4ResearchTuningReceipt.baseline_and_deltas
        ?.gap_to_gate_verification_recall_at_far10 === 0.0874
      && Array.isArray(
        recognizerRun4ResearchTuningReceipt.trainer_surface?.missing_for_selected_next_slice,
      )
      && recognizerRun4ResearchTuningReceipt.trainer_surface
        .missing_for_selected_next_slice.includes("--supcon-weight")
      && recognizerRun4ResearchTuningReceipt.trainer_surface
        .missing_for_selected_next_slice.includes("--supcon-temperature")
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.attempted === true
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.status === "blocked_no_browser_control_tool_exposed"
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.used === true
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.route === "openai-api-research"
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.model_requested === "gpt-5.5"
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.response_id
        === "resp_05ffe9eb9de0fb1a006a20de969a748195b66183a7e41a80ab"
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.status === "completed"
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.model_returned === "gpt-5.5-2026-04-23"
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.total_tokens === 9167
      && exists(recognizerRun4ResearchTuningPromptFilePath)
      && exists(recognizerRun4ResearchTuningRequestFilePath)
      && exists(recognizerRun4ResearchTuningRawFilePath)
      && exists(recognizerRun4ResearchTuningResponseFilePath)
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.prompt_md
        === sha256(recognizerRun4ResearchTuningPromptFilePath)
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.request_json
        === sha256(recognizerRun4ResearchTuningRequestFilePath)
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.raw_json
        === sha256(recognizerRun4ResearchTuningRawFilePath)
      && recognizerRun4ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.response_md
        === sha256(recognizerRun4ResearchTuningResponseFilePath)
      && recognizerRun4ResearchTuningReceipt.research_conclusion
        ?.selected_next_action === recognizerRun5SupconPreflightNextAction
      && recognizerRun4ResearchTuningReceipt.research_conclusion
        ?.selected_preflight?.includes("supervised contrastive")
      && recognizerRun4ResearchTuningReceipt.research_conclusion
        ?.why_t40_waits?.includes("T=32 was useful")
      && recognizerRun4ResearchTuningReceipt.research_conclusion
        ?.run5_recipe_if_preflight_passes?.supcon_weight === 0.05
      && recognizerRun4ResearchTuningReceipt.research_conclusion
        ?.run5_recipe_if_preflight_passes?.supcon_temperature === 0.1
      && recognizerRun4ResearchTuningReceipt.research_conclusion
        ?.run5_recipe_if_preflight_passes?.sequence_length === 32
      && recognizerRun4ResearchTuningReceipt.research_conclusion
        ?.run5_recipe_if_preflight_passes?.expected_optimizer_steps === 13200
      && recognizerRun4ResearchTuningReceipt.brev_visibility
        ?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.status === "STOPPED"
      && recognizerRun4ResearchTuningReceipt.brev_visibility
        ?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.health_status === "HEALTHY"
      && recognizerRun4ResearchTuningReceipt.boundaries?.brev_used === false
      && recognizerRun4ResearchTuningReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun4ResearchTuningReceipt.boundaries?.remote_mutation === false
      && recognizerRun4ResearchTuningReceipt.boundaries?.training_run === false
      && recognizerRun4ResearchTuningReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun4ResearchTuningReceipt.boundaries?.checkpoint_written === false
      && recognizerRun4ResearchTuningReceipt.boundaries?.browser_promotion === false
      && recognizerRun4ResearchTuningReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun4ResearchTuningReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun4ResearchTuningReceipt.boundaries?.final_gate_changed === false
      && recognizerRun4ResearchTuningReceipt.next_action?.token
        === recognizerRun5SupconPreflightNextAction,
    {
      path: recognizerRun4ResearchTuningReceiptPath,
      status: recognizerRun4ResearchTuningReceipt.status ?? null,
      run4_summary: recognizerRun4ResearchTuningReceipt.run4_summary ?? null,
      trainer_surface: recognizerRun4ResearchTuningReceipt.trainer_surface ?? null,
      research_escalation:
        recognizerRun4ResearchTuningReceipt.research_escalation ?? null,
      research_conclusion:
        recognizerRun4ResearchTuningReceipt.research_conclusion ?? null,
      brev_visibility: recognizerRun4ResearchTuningReceipt.brev_visibility ?? null,
      boundaries: recognizerRun4ResearchTuningReceipt.boundaries ?? null,
      next_action: recognizerRun4ResearchTuningReceipt.next_action ?? null,
    },
    "recognizer run4 research tuning must record GPT-Pro/browser unavailability, gpt-5.5 API fallback, artifact hashes, selected supervised-contrastive local preflight, T=40 deferral, stopped Brev visibility, and no Brev/training boundary",
  );
  const zeroSupconStats =
    recognizerRun5SupconZeroWeightDryrunReceipt.dry_run_forward
      ?.loss_components?.supcon ?? {};
  const weightedSupconStats =
    recognizerRun5SupconWeight005DryrunReceipt.dry_run_forward
      ?.loss_components?.supcon ?? {};
  addCheck(
    checks,
    blockers,
    "recognizer_run5_supcon_preflight_dryruns_no_brev_no_checkpoint",
    recognizerRun5SupconPreflightReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run5-supcon-preflight/v1"
      && recognizerRun5SupconPreflightReceipt.status
        === "completed_supcon_preflight_no_brev_no_training"
      && recognizerRun5SupconPreflightReceipt.slice
        === recognizerRun5SupconPreflightNextAction
      && recognizerRun5SupconPreflightReceipt.inputs?.run4_research_tuning_receipt
        === recognizerRun4ResearchTuningReceiptPath
      && recognizerRun5SupconPreflightReceipt.side_worktree?.commit
        ?.startsWith("896d5fb") === true
      && recognizerRun5SupconPreflightReceipt.side_worktree
        ?.scoped_files_clean_after_side_commit === true
      && recognizerRun5SupconPreflightReceipt.side_worktree?.sha256
        ?.seq_transformer_py === "040a3f7546af1ddc20f145c76cdec54853f12922eb315bd27c11f55aac4387c1"
      && recognizerRun5SupconPreflightReceipt.side_worktree?.sha256
        ?.train_recognizer_distill_py === "c91559e7a68f350a0a79fb703c408e452564861d61ab80b39ba4b40b87c66961"
      && recognizerRun5SupconPreflightReceipt.side_worktree?.sha256
        ?.test_recognizer_distill_diagnostics_py
        === "a5eeb74be2a00461a534be959a2530440d407264ab0eaddcf45d3b107833548a"
      && recognizerRun5SupconPreflightReceipt.implementation
        ?.runtime_inference_changed === false
      && recognizerRun5SupconPreflightReceipt.implementation?.flag_defaults
        ?.supcon_weight === 0
      && recognizerRun5SupconPreflightReceipt.implementation?.flag_defaults
        ?.supcon_temperature === 0.1
      && recognizerRun5SupconPreflightReceipt.implementation?.supcon_loss
        ?.weight_zero_preserves_ce_kd === true
      && recognizerRun5SupconPreflightReceipt.zero_weight_dryrun
        ?.receipt_sha256 === sha256(recognizerRun5SupconZeroWeightDryrunReceiptFilePath)
      && recognizerRun5SupconPreflightReceipt.weighted_supcon_dryrun
        ?.receipt_sha256 === sha256(recognizerRun5SupconWeight005DryrunReceiptFilePath)
      && recognizerRun5SupconZeroWeightDryrunReceipt.training_mode
        === "dry_run_forward"
      && recognizerRun5SupconZeroWeightDryrunReceipt.student_cache?.clips
        === 10335
      && recognizerRun5SupconZeroWeightDryrunReceipt.student_cache
        ?.sequence_length === 32
      && recognizerRun5SupconZeroWeightDryrunReceipt.student_cache
        ?.feature_dim === 90
      && recognizerRun5SupconZeroWeightDryrunReceipt.classes === 95
      && recognizerRun5SupconZeroWeightDryrunReceipt.train_clips === 7011
      && recognizerRun5SupconZeroWeightDryrunReceipt.monitor_clips === 955
      && recognizerRun5SupconZeroWeightDryrunReceipt.test_clips === 2369
      && recognizerRun5SupconZeroWeightDryrunReceipt.dry_run_forward
        ?.batch_size === 128
      && recognizerRun5SupconZeroWeightDryrunReceipt.dry_run_forward
        ?.logits_shape?.[0] === 128
      && recognizerRun5SupconZeroWeightDryrunReceipt.dry_run_forward
        ?.logits_shape?.[1] === 95
      && zeroSupconStats.enabled === false
      && recognizerRun5SupconZeroWeightDryrunReceipt.dry_run_forward
        ?.loss_components?.loss
        === recognizerRun5SupconZeroWeightDryrunReceipt.dry_run_forward
          ?.loss_components?.base_loss
      && recognizerRun5SupconZeroWeightDryrunReceipt.optimizer_steps === 0
      && recognizerRun5SupconZeroWeightDryrunReceipt.expected_optimizer_steps === 0
      && recognizerRun5SupconZeroWeightDryrunReceipt.planned_optimizer_steps
        === 13200
      && recognizerRun5SupconZeroWeightDryrunReceipt.weights === null
      && recognizerRun5SupconWeight005DryrunReceipt.training_mode
        === "dry_run_forward"
      && recognizerRun5SupconWeight005DryrunReceipt.student_cache?.clips
        === 10335
      && recognizerRun5SupconWeight005DryrunReceipt.student_cache
        ?.sequence_length === 32
      && recognizerRun5SupconWeight005DryrunReceipt.student_cache
        ?.feature_dim === 90
      && recognizerRun5SupconWeight005DryrunReceipt.classes === 95
      && recognizerRun5SupconWeight005DryrunReceipt.train_clips === 7011
      && recognizerRun5SupconWeight005DryrunReceipt.monitor_clips === 955
      && recognizerRun5SupconWeight005DryrunReceipt.test_clips === 2369
      && recognizerRun5SupconWeight005DryrunReceipt.dry_run_forward
        ?.batch_size === 128
      && recognizerRun5SupconWeight005DryrunReceipt.dry_run_forward
        ?.logits_shape?.[0] === 128
      && recognizerRun5SupconWeight005DryrunReceipt.dry_run_forward
        ?.logits_shape?.[1] === 95
      && recognizerRun5SupconWeight005DryrunReceipt.dry_run_forward
        ?.loss_components?.base_loss
        === recognizerRun5SupconZeroWeightDryrunReceipt.dry_run_forward
          ?.loss_components?.base_loss
      && weightedSupconStats.enabled === true
      && weightedSupconStats.weight === 0.05
      && weightedSupconStats.temperature === 0.1
      && weightedSupconStats.embedding_dim === 256
      && weightedSupconStats.embedding_norm_mean === 1
      && weightedSupconStats.positive_anchors > 0
      && weightedSupconStats.positive_pairs > 0
      && Number.isFinite(weightedSupconStats.loss)
      && weightedSupconStats.loss > 0
      && Number.isFinite(weightedSupconStats.weighted_loss)
      && weightedSupconStats.weighted_loss > 0
      && recognizerRun5SupconWeight005DryrunReceipt.optimizer_steps === 0
      && recognizerRun5SupconWeight005DryrunReceipt.expected_optimizer_steps === 0
      && recognizerRun5SupconWeight005DryrunReceipt.planned_optimizer_steps
        === 13200
      && recognizerRun5SupconWeight005DryrunReceipt.weights === null
      && recognizerRun5SupconPreflightReceipt.local_validation
        ?.checkpoint_absence_checks?.every((check) => check.exists === false)
      && recognizerRun5SupconPreflightReceipt.brev_visibility
        ?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.status === "STOPPED"
      && recognizerRun5SupconPreflightReceipt.brev_visibility
        ?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.health_status === "HEALTHY"
      && recognizerRun5SupconPreflightReceipt.boundaries?.brev_used === false
      && recognizerRun5SupconPreflightReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun5SupconPreflightReceipt.boundaries?.training_run
        === false
      && recognizerRun5SupconPreflightReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun5SupconPreflightReceipt.boundaries?.checkpoint_written
        === false
      && recognizerRun5SupconPreflightReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRun5SupconPreflightReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun5SupconPreflightReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun5SupconPreflightReceipt.boundaries?.final_gate_changed
        === false
      && recognizerRun5SupconPreflightReceipt.run5_recipe_if_preflight_passes
        ?.token === recognizerRun5SupconFulltrainNextAction
      && recognizerRun5SupconPreflightReceipt.run5_recipe_if_preflight_passes
        ?.supcon_weight === 0.05
      && recognizerRun5SupconPreflightReceipt.run5_recipe_if_preflight_passes
        ?.supcon_temperature === 0.1
      && recognizerRun5SupconPreflightReceipt.run5_recipe_if_preflight_passes
        ?.sequence_length === 32
      && recognizerRun5SupconPreflightReceipt.run5_recipe_if_preflight_passes
        ?.expected_optimizer_steps === 13200
      && recognizerRun5SupconPreflightReceipt.next_action?.token
        === recognizerRun5SupconFulltrainNextAction,
    {
      path: recognizerRun5SupconPreflightReceiptPath,
      status: recognizerRun5SupconPreflightReceipt.status ?? null,
      side_worktree: recognizerRun5SupconPreflightReceipt.side_worktree ?? null,
      implementation: recognizerRun5SupconPreflightReceipt.implementation ?? null,
      zero_weight_dryrun:
        recognizerRun5SupconPreflightReceipt.zero_weight_dryrun ?? null,
      weighted_supcon_dryrun:
        recognizerRun5SupconPreflightReceipt.weighted_supcon_dryrun ?? null,
      focused_zero_weight: recognizerRun5SupconZeroWeightDryrunReceipt
        ?.dry_run_forward ?? null,
      focused_weight005: recognizerRun5SupconWeight005DryrunReceipt
        ?.dry_run_forward ?? null,
      boundaries: recognizerRun5SupconPreflightReceipt.boundaries ?? null,
      next_action: recognizerRun5SupconPreflightReceipt.next_action ?? null,
    },
    "recognizer run5 SupCon preflight must record disabled-by-default flags, side code hashes, zero-weight CE/KD preservation, finite weighted SupCon dry-run with positive anchors, zero optimizer steps, no checkpoint, no Brev lifecycle/training, and run5 fulltrain next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run5_research_tuning_selects_verification_margin_preflight_no_brev",
    recognizerRun5ResearchTuningReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run5-research-tuning/v1"
      && recognizerRun5ResearchTuningReceipt.status
        === "completed_research_tuning_no_brev_no_training"
      && recognizerRun5ResearchTuningReceipt.slice
        === recognizerRun5ResearchTuningNextAction
      && recognizerRun5ResearchTuningReceipt.inputs?.run5_receipt
        === recognizerRun5SupconFulltrainReceiptPath
      && recognizerRun5ResearchTuningReceipt.metric_definition?.far === 0.10
      && recognizerRun5ResearchTuningReceipt.metric_definition
        ?.threshold?.includes("90th percentile")
      && recognizerRun5ResearchTuningReceipt.run5_summary?.sequence_length
        === 32
      && recognizerRun5ResearchTuningReceipt.run5_summary?.train_clips === 7011
      && recognizerRun5ResearchTuningReceipt.run5_summary?.monitor_clips
        === 955
      && recognizerRun5ResearchTuningReceipt.run5_summary?.test_clips === 2369
      && recognizerRun5ResearchTuningReceipt.run5_summary?.feature_dim === 90
      && recognizerRun5ResearchTuningReceipt.run5_summary?.classes === 95
      && recognizerRun5ResearchTuningReceipt.run5_summary
        ?.verification_recall_at_far10 === 0.7601
      && recognizerRun5ResearchTuningReceipt.run5_summary?.test_top1 === 0.3369
      && recognizerRun5ResearchTuningReceipt.run5_summary?.test_top5 === 0.6235
      && recognizerRun5ResearchTuningReceipt.run5_summary?.supcon_weight === 0.05
      && recognizerRun5ResearchTuningReceipt.run5_summary
        ?.supcon_temperature === 0.10
      && recognizerRun5ResearchTuningReceipt.run4_vs_run5
        ?.run4_verification_recall_at_far10 === 0.7626
      && recognizerRun5ResearchTuningReceipt.run4_vs_run5
        ?.delta_run5_minus_run4_verification_recall_at_far10 === -0.0025
      && recognizerRun5ResearchTuningReceipt.run4_vs_run5
        ?.run5_beats_run4_primary_recall === false
      && recognizerRun5ResearchTuningReceipt.run4_vs_run5
        ?.primary_running_best === "run4"
      && recognizerRun5ResearchTuningReceipt.run5_supcon_and_confidence_diagnostics
        ?.final_epoch?.positive_anchors === 5192
      && recognizerRun5ResearchTuningReceipt.run5_supcon_and_confidence_diagnostics
        ?.final_epoch?.mean_max_prob === 0.982412
      && Array.isArray(
        recognizerRun5ResearchTuningReceipt.trainer_surface?.missing_for_selected_next_slice,
      )
      && recognizerRun5ResearchTuningReceipt.trainer_surface
        .missing_for_selected_next_slice.includes("tools/diagnose_verification_margins.py")
      && recognizerRun5ResearchTuningReceipt.trainer_surface
        .missing_for_selected_next_slice.includes("--checkpoint-metric monitor_verification_recall_far10")
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.attempted === true
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.status === "blocked_no_browser_control_iab_tool_exposed"
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.used === true
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.route === "openai-api-research"
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.model_requested === "gpt-5.5"
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.response_id
        === "resp_0f2d762a2b650446006a20ed66f0e081908582af4debbf834a"
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.status === "completed"
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.model_returned === "gpt-5.5-2026-04-23"
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.total_tokens === 10782
      && exists(recognizerRun5ResearchTuningPromptFilePath)
      && exists(recognizerRun5ResearchTuningRequestFilePath)
      && exists(recognizerRun5ResearchTuningRawFilePath)
      && exists(recognizerRun5ResearchTuningResponseFilePath)
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.prompt_md
        === sha256(recognizerRun5ResearchTuningPromptFilePath)
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.request_json
        === sha256(recognizerRun5ResearchTuningRequestFilePath)
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.raw_json
        === sha256(recognizerRun5ResearchTuningRawFilePath)
      && recognizerRun5ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.response_md
        === sha256(recognizerRun5ResearchTuningResponseFilePath)
      && recognizerRun5ResearchTuningReceipt.research_conclusion
        ?.selected_next_action === recognizerRun6VerificationMarginPreflightNextAction
      && recognizerRun5ResearchTuningReceipt.research_conclusion
        ?.model_recommended_token
        === "IMPLEMENT_VERIFY_MARGIN_DIAGNOSTIC_AND_VERIF_SELECTION_PREFLIGHT"
      && recognizerRun5ResearchTuningReceipt.research_conclusion
        ?.selected_preflight?.includes("verification-margin diagnostic")
      && recognizerRun5ResearchTuningReceipt.research_conclusion
        ?.why_supcon_tuning_waits?.includes("Run5 SupCon")
      && recognizerRun5ResearchTuningReceipt.research_conclusion
        ?.why_t40_waits?.includes("T=40")
      && recognizerRun5ResearchTuningReceipt.research_conclusion
        ?.run6_recipe_if_preflight_passes?.token
        === "m3jb_recognizer_transformer_run6_t32_verifselect_fulltrain_brev_ok"
      && recognizerRun5ResearchTuningReceipt.research_conclusion
        ?.run6_recipe_if_preflight_passes?.supcon_weight === 0
      && recognizerRun5ResearchTuningReceipt.research_conclusion
        ?.run6_recipe_if_preflight_passes?.checkpoint_metric
        === "monitor_verification_recall_far10"
      && recognizerRun5ResearchTuningReceipt.research_conclusion
        ?.run6_recipe_if_preflight_passes?.expected_optimizer_steps === 13200
      && recognizerRun5ResearchTuningReceipt.brev_visibility
        ?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.status === "STOPPED"
      && recognizerRun5ResearchTuningReceipt.brev_visibility
        ?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.health_status === "HEALTHY"
      && recognizerRun5ResearchTuningReceipt.boundaries?.brev_used === false
      && recognizerRun5ResearchTuningReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun5ResearchTuningReceipt.boundaries?.remote_mutation === false
      && recognizerRun5ResearchTuningReceipt.boundaries?.training_run === false
      && recognizerRun5ResearchTuningReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun5ResearchTuningReceipt.boundaries?.checkpoint_written
        === false
      && recognizerRun5ResearchTuningReceipt.boundaries?.browser_promotion
        === false
      && recognizerRun5ResearchTuningReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun5ResearchTuningReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun5ResearchTuningReceipt.boundaries?.final_gate_changed
        === false
      && recognizerRun5ResearchTuningReceipt.next_action?.token
        === recognizerRun6VerificationMarginPreflightNextAction,
    {
      path: recognizerRun5ResearchTuningReceiptPath,
      status: recognizerRun5ResearchTuningReceipt.status ?? null,
      run4_vs_run5: recognizerRun5ResearchTuningReceipt.run4_vs_run5 ?? null,
      trainer_surface: recognizerRun5ResearchTuningReceipt.trainer_surface ?? null,
      research_escalation:
        recognizerRun5ResearchTuningReceipt.research_escalation ?? null,
      research_conclusion:
        recognizerRun5ResearchTuningReceipt.research_conclusion ?? null,
      brev_visibility: recognizerRun5ResearchTuningReceipt.brev_visibility ?? null,
      boundaries: recognizerRun5ResearchTuningReceipt.boundaries ?? null,
      next_action: recognizerRun5ResearchTuningReceipt.next_action ?? null,
    },
    "recognizer run5 research tuning must record GPT-Pro/browser unavailability, gpt-5.5 API fallback, artifact hashes, run4-vs-run5 metric divergence, selected verification-margin diagnostic and monitor-verification selection preflight, stopped Brev visibility, and no Brev/training boundary",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_verification_margin_preflight_selects_verifselect_fulltrain_brev",
    recognizerRun6VerificationMarginPreflightReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run6-verification-margin-preflight/v1"
      && recognizerRun6VerificationMarginPreflightReceipt.status
        === "completed_verification_margin_and_selection_preflight_no_brev_no_training"
      && recognizerRun6VerificationMarginPreflightReceipt.slice
        === recognizerRun6VerificationMarginPreflightNextAction
      && recognizerRun6VerificationMarginPreflightReceipt.side_worktree?.commit
        === "0f54967a123946ccb12e1b6f918ca26629161986"
      && recognizerRun6VerificationMarginPreflightReceipt.side_worktree
        ?.sha256?.verification_py
        === "f66bae99a461d866f2127ad2a118f92ee2a1d7c7feb08ca58562ce59b087be9c"
      && recognizerRun6VerificationMarginPreflightReceipt.side_worktree
        ?.sha256?.train_recognizer_distill_py
        === "a39a27f01d6bb79b67a577eb52453624f90c099ff63d1235096378e4af8f3509"
      && recognizerRun6VerificationMarginPreflightReceipt.side_worktree
        ?.sha256?.diagnose_verification_margins_py
        === recognizerRun6VerificationMarginDiagnosticHistoricalSha256
      && recognizerRun6VerificationMarginPreflightReceipt.implementation
        ?.shared_metric_helper?.function === "recall_at_far_details"
      && recognizerRun6VerificationMarginPreflightReceipt.implementation
        ?.trainer_flags?.includes("--checkpoint-metric monitor_verification_recall_far10")
      && recognizerRun6VerificationMarginPreflightReceipt.implementation
        ?.runtime_inference_changed === false
      && recognizerRun6VerificationMarginPreflightReceipt
        .verification_margin_diagnostic?.receipt_sha256
        === sha256(recognizerRun6VerificationMarginDiagnosticReceiptFilePath)
      && recognizerRun6VerificationMarginDiagnosticReceipt.status
        === "passed_no_training_verification_margin_diagnostic"
      && recognizerRun6VerificationMarginDiagnosticReceipt.actual_counts?.clips
        === 10335
      && recognizerRun6VerificationMarginDiagnosticReceipt.actual_counts
        ?.train_clips === 7011
      && recognizerRun6VerificationMarginDiagnosticReceipt.actual_counts
        ?.monitor_clips === 955
      && recognizerRun6VerificationMarginDiagnosticReceipt.actual_counts
        ?.test_clips === 2369
      && recognizerRun6VerificationMarginDiagnosticReceipt.actual_counts
        ?.classes === 95
      && recognizerRun6VerificationMarginDiagnosticReceipt.actual_counts
        ?.sequence_length === 32
      && recognizerRun6VerificationMarginDiagnosticReceipt.actual_counts
        ?.feature_dim === 90
      && recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run4
        ?.reproduction?.within_tolerance === true
      && recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run5
        ?.reproduction?.within_tolerance === true
      && round(
        recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run4
          ?.test?.verification?.mean_recall_at_far10,
      ) === 0.762615
      && round(
        recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run5
          ?.test?.verification?.mean_recall_at_far10,
      ) === 0.760931
      && round(
        recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run4
          ?.monitor?.verification?.mean_recall_at_far10,
      ) === 0.787897
      && round(
        recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run5
          ?.monitor?.verification?.mean_recall_at_far10,
      ) === 0.791417
      && Array.isArray(
        recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run4
          ?.test?.verification?.top_failure_words,
      )
      && recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run4
        ?.test?.verification?.top_failure_words?.[0]?.far10_threshold != null
      && recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run4
        ?.test?.verification?.top_failure_words?.[0]?.positive_quantiles?.p10 != null
      && recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run4
        ?.test?.verification?.top_failure_words?.[0]?.negative_quantiles?.p99 != null
      && recognizerRun6VerificationMarginDiagnosticReceipt.comparisons
        ?.primary_running_best_by_test_verification === "run4"
      && recognizerRun6VerificationMarginDiagnosticReceipt.comparisons
        ?.best_by_monitor_verification_recall_far10 === "run5"
      && recognizerRun6VerificationMarginPreflightReceipt
        .trainer_verifselect_dryrun?.receipt_sha256
        === sha256(recognizerRun6VerifselectDryrunReceiptFilePath)
      && recognizerRun6VerifselectDryrunReceipt.training_mode
        === "dry_run_forward"
      && recognizerRun6VerifselectDryrunReceipt.train_clips === 7011
      && recognizerRun6VerifselectDryrunReceipt.monitor_clips === 955
      && recognizerRun6VerifselectDryrunReceipt.test_clips === 2369
      && recognizerRun6VerifselectDryrunReceipt.optimizer_steps === 0
      && recognizerRun6VerifselectDryrunReceipt.expected_optimizer_steps === 0
      && recognizerRun6VerifselectDryrunReceipt.planned_optimizer_steps === 13200
      && recognizerRun6VerifselectDryrunReceipt.weights === null
      && recognizerRun6VerifselectDryrunReceipt.checkpoint_selection
        ?.metric_name === "monitor_verification_recall_far10"
      && recognizerRun6VerifselectDryrunReceipt.checkpoint_selection
        ?.metric_available_in_dry_run === true
      && recognizerRun6VerifselectDryrunReceipt.checkpoint_selection
        ?.checkpoint_written === false
      && recognizerRun6VerifselectDryrunReceipt.dry_run_forward
        ?.monitor_verification_classes_evaluable === 95
      && recognizerRun6VerificationMarginPreflightReceipt.brev_visibility
        ?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.status === "STOPPED"
      && recognizerRun6VerificationMarginPreflightReceipt.brev_visibility
        ?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.health_status === "HEALTHY"
      && recognizerRun6VerificationMarginPreflightReceipt.boundaries
        ?.brev_used === false
      && recognizerRun6VerificationMarginPreflightReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun6VerificationMarginPreflightReceipt.boundaries
        ?.training_run === false
      && recognizerRun6VerificationMarginPreflightReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun6VerificationMarginPreflightReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun6VerificationMarginPreflightReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRun6VerificationMarginPreflightReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerRun6VerificationMarginPreflightReceipt
        .run6_recipe_if_preflight_passes?.token
        === recognizerRun6VerifselectFulltrainNextAction
      && recognizerRun6VerificationMarginPreflightReceipt
        .run6_recipe_if_preflight_passes?.checkpoint_metric
        === "monitor_verification_recall_far10"
      && recognizerRun6VerificationMarginPreflightReceipt
        .run6_recipe_if_preflight_passes?.supcon_weight === 0.0
      && recognizerRun6VerificationMarginPreflightReceipt
        .run6_recipe_if_preflight_passes?.expected_optimizer_steps === 13200
      && recognizerRun6VerificationMarginPreflightReceipt.next_action?.token
        === recognizerRun6VerifselectFulltrainNextAction,
    {
      path: recognizerRun6VerificationMarginPreflightReceiptPath,
      status: recognizerRun6VerificationMarginPreflightReceipt.status ?? null,
      side_worktree:
        recognizerRun6VerificationMarginPreflightReceipt.side_worktree ?? null,
      diagnostic: {
        path: recognizerRun6VerificationMarginDiagnosticReceiptPath,
        status: recognizerRun6VerificationMarginDiagnosticReceipt.status ?? null,
        counts: recognizerRun6VerificationMarginDiagnosticReceipt.actual_counts ?? null,
        comparisons:
          recognizerRun6VerificationMarginDiagnosticReceipt.comparisons ?? null,
      },
      dryrun: {
        path: recognizerRun6VerifselectDryrunReceiptPath,
        training_mode: recognizerRun6VerifselectDryrunReceipt.training_mode ?? null,
        checkpoint_selection:
          recognizerRun6VerifselectDryrunReceipt.checkpoint_selection ?? null,
        optimizer_steps:
          recognizerRun6VerifselectDryrunReceipt.optimizer_steps ?? null,
        weights: recognizerRun6VerifselectDryrunReceipt.weights ?? null,
      },
      boundaries:
        recognizerRun6VerificationMarginPreflightReceipt.boundaries ?? null,
      next_action:
        recognizerRun6VerificationMarginPreflightReceipt.next_action ?? null,
    },
    "recognizer run6 verification-margin preflight must record detailed per-class margin diagnostics, reported test-recall reproduction, full T=32 counts, monitor verification checkpoint-selection dry-run, no checkpoint/training/Brev boundary, and run6 verif-select fulltrain next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_t32_brev_preflight_deferred_before_sync_or_training",
    recognizerRun6T32PreflightBlockerReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run6-t32-brev-preflight-blocker/v1"
      && recognizerRun6T32PreflightBlockerReceipt.status
        === "deferred_before_remote_sync_or_training_worker_ssh_unavailable_then_recovered_stopped_healthy"
      && recognizerRun6T32PreflightBlockerReceipt.slice
        === recognizerRun6VerifselectFulltrainNextAction
      && recognizerRun6T32PreflightBlockerReceipt.source_of_truth
        ?.previous_preflight_receipt
        === recognizerRun6VerificationMarginPreflightReceiptPath
      && recognizerRun6T32PreflightBlockerReceipt.worker?.initial_brev_ls
        ?.retained?.status === "STOPPED"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.initial_brev_ls
        ?.retained?.health_status === "HEALTHY"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.start?.exit_code === 0
      && recognizerRun6T32PreflightBlockerReceipt.worker?.remote_preflight
        ?.exit_code === 124
      && recognizerRun6T32PreflightBlockerReceipt.worker?.remote_preflight
        ?.ssh_available === false
      && recognizerRun6T32PreflightBlockerReceipt.worker?.remote_preflight
        ?.training_launched === false
      && recognizerRun6T32PreflightBlockerReceipt.worker?.pre_stop_brev_ls
        ?.retained?.status === "UNHEALTHY"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.pre_stop_brev_ls
        ?.retained?.shell_status === "READY"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.teardown
        ?.stop_by_name?.exit_code === 0
      && recognizerRun6T32PreflightBlockerReceipt.worker?.teardown
        ?.stop_by_id?.exit_code === 0
      && recognizerRun6T32PreflightBlockerReceipt.worker?.teardown
        ?.stop_all?.exit_code === 0
      && recognizerRun6T32PreflightBlockerReceipt.worker?.teardown
        ?.post_initial_teardown_brev_ls?.retained?.health_status === "UNHEALTHY"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.teardown
        ?.late_validation_brev_ls?.retained?.status === "RUNNING"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.teardown
        ?.late_validation_brev_ls?.retained?.shell_status === "READY"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.teardown
        ?.late_validation_brev_ls?.retained?.health_status === "HEALTHY"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.teardown
        ?.late_stop_after_validation?.exit_code === 0
      && recognizerRun6T32PreflightBlockerReceipt.worker?.teardown
        ?.late_stop_after_validation_brev_ls?.retained?.status === "STOPPING"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.teardown
        ?.destructive_infrastructure_action === false
      && recognizerRun6T32PreflightBlockerReceipt.worker?.final_brev_ls
        ?.retained?.status === "STOPPED"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.final_brev_ls
        ?.retained?.shell_status === "NOT READY"
      && recognizerRun6T32PreflightBlockerReceipt.worker?.final_brev_ls
        ?.retained?.health_status === "HEALTHY"
      && recognizerRun6T32PreflightBlockerReceipt.local_hashes
        ?.["verification.py"]
        === "f66bae99a461d866f2127ad2a118f92ee2a1d7c7feb08ca58562ce59b087be9c"
      && recognizerRun6T32PreflightBlockerReceipt.local_hashes
        ?.["train_recognizer_distill.py"]
        === "a39a27f01d6bb79b67a577eb52453624f90c099ff63d1235096378e4af8f3509"
      && recognizerRun6T32PreflightBlockerReceipt.local_hashes
        ?.["diagnose_verification_margins.py"]
        === recognizerRun6VerificationMarginDiagnosticHistoricalSha256
      && recognizerRun6T32PreflightBlockerReceipt.local_hashes
        ?.[".cache/recog-seq-w64-t32-merged-v1/rows.json"]
        === "4dc3f61018a0faf7dccdc7f3653075650683b741bf7d6f7ebde2be878dd9eb9f"
      && recognizerRun6T32PreflightBlockerReceipt.sync
        ?.remote_sync_attempted === false
      && recognizerRun6T32PreflightBlockerReceipt.sync
        ?.remote_hash_verification_attempted === false
      && recognizerRun6T32PreflightBlockerReceipt.run
        ?.training_launched === false
      && recognizerRun6T32PreflightBlockerReceipt.run
        ?.checkpoint_written === false
      && recognizerRun6T32PreflightBlockerReceipt.run
        ?.artifact_copyback_attempted === false
      && recognizerRun6T32PreflightBlockerReceipt.run
        ?.no_limit_flags_in_planned_command === true
      && recognizerRun6T32PreflightBlockerReceipt.run
        ?.expected_counts?.student_cache_clips === 10335
      && recognizerRun6T32PreflightBlockerReceipt.run
        ?.expected_counts?.expected_optimizer_steps === 13200
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.brev_used === true
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.brev_lifecycle_or_exec === true
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.remote_sync_attempted === false
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.training_run === false
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.optimizer_or_backward_step === false
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.checkpoint_written === false
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.artifacts_copied_back === false
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.worker_stopped_after_attempt === true
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.worker_final_status === "STOPPED"
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.worker_final_health_status === "HEALTHY"
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun6T32PreflightBlockerReceipt.runtime_boundary
        ?.final_gate_changed === false
      && recognizerRun6T32PreflightBlockerReceipt.next_action?.token
        === recognizerRun6VerifselectFulltrainNextAction,
    {
      path: recognizerRun6T32PreflightBlockerReceiptPath,
      status: recognizerRun6T32PreflightBlockerReceipt.status ?? null,
      worker: recognizerRun6T32PreflightBlockerReceipt.worker ?? null,
      sync: recognizerRun6T32PreflightBlockerReceipt.sync ?? null,
      run: recognizerRun6T32PreflightBlockerReceipt.run ?? null,
      runtime_boundary:
        recognizerRun6T32PreflightBlockerReceipt.runtime_boundary ?? null,
      next_action: recognizerRun6T32PreflightBlockerReceipt.next_action ?? null,
    },
    "recognizer run6 T=32 Brev preflight-deferred receipt must stop before remote sync/training when SSH/CUDA/process preflight is unavailable, record late worker recovery, verify the worker stopped healthy, and select retry-fulltrain next",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_verifselect_fulltrain_completed_fail_closed",
    recognizerRun6VerifselectFulltrainReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-fulltrain-run6-verifselect-brev/v1"
      && recognizerRun6VerifselectFulltrainReceipt.status
        === "completed_rejected_fail_closed_below_gate_running_best_improved"
      && recognizerRun6VerifselectFulltrainReceipt.slice
        === recognizerRun6VerifselectFulltrainNextAction
      && recognizerRun6VerifselectFulltrainReceipt.source_of_truth
        ?.previous_preflight_receipt
        === recognizerRun6VerificationMarginPreflightReceiptPath
      && recognizerRun6VerifselectFulltrainReceipt.source_of_truth
        ?.previous_preflight_deferred_receipt
        === recognizerRun6T32PreflightBlockerReceiptPath
      && recognizerRun6VerifselectFulltrainReceipt.source_of_truth
        ?.side_worktree_commit_synced?.startsWith("0f54967") === true
      && recognizerRun6VerifselectFulltrainReceipt.worker?.remote_preflight
        ?.ssh_probe_passed_attempt === 1
      && recognizerRun6VerifselectFulltrainReceipt.worker?.remote_preflight
        ?.cuda_available === true
      && recognizerRun6VerifselectFulltrainReceipt.worker?.remote_preflight
        ?.conflicting_training_process_found === false
      && recognizerRun6VerifselectFulltrainReceipt.sync
        ?.remote_sync_attempted === true
      && recognizerRun6VerifselectFulltrainReceipt.sync
        ?.remote_hash_verification_attempted === true
      && recognizerRun6VerifselectFulltrainReceipt.sync
        ?.remote_hashes_match_local === true
      && recognizerRun6VerifselectFulltrainReceipt.sync?.local_hashes
        ?.["train_recognizer_distill.py"]
        === "a39a27f01d6bb79b67a577eb52453624f90c099ff63d1235096378e4af8f3509"
      && recognizerRun6VerifselectFulltrainReceipt.sync?.local_hashes
        ?.["verification.py"]
        === "f66bae99a461d866f2127ad2a118f92ee2a1d7c7feb08ca58562ce59b087be9c"
      && recognizerRun6VerifselectFulltrainReceipt.sync?.local_hashes
        ?.["diagnose_verification_margins.py"]
        === recognizerRun6VerificationMarginDiagnosticHistoricalSha256
      && recognizerRun6VerifselectFulltrainReceipt.sync?.local_hashes
        ?.["seq_transformer.py"]
        === "040a3f7546af1ddc20f145c76cdec54853f12922eb315bd27c11f55aac4387c1"
      && recognizerRun6VerifselectFulltrainReceipt.sync?.local_hashes
        ?.[".cache/recog-seq-w64-t32-merged-v1/rows.json"]
        === "4dc3f61018a0faf7dccdc7f3653075650683b741bf7d6f7ebde2be878dd9eb9f"
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run
        ?.student_cache_clips === 10335
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run?.train_clips
        === 7011
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run
        ?.monitor_clips === 955
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run?.test_clips
        === 2369
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run?.classes
        === 95
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run
        ?.sequence_length === 32
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run?.feature_dim
        === 90
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run
        ?.logits_shape?.[0] === 128
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run
        ?.logits_shape?.[1] === 95
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run
        ?.optimizer_steps === 0
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run?.weights
        === null
      && recognizerRun6VerifselectFulltrainReceipt.remote_dry_run
        ?.receipt_sha256 === sha256(sideRecognizerRun6VerifselectPretrainDryrunPath)
      && recognizerRun6VerifselectFulltrainReceipt.run?.full_data_no_limit_flags
        === true
      && recognizerRun6VerifselectFulltrainReceipt.run?.training_launched
        === true
      && recognizerRun6VerifselectFulltrainReceipt.run?.checkpoint_written
        === true
      && recognizerRun6VerifselectFulltrainReceipt.run?.artifact_copyback_attempted
        === true
      && recognizerRun6VerifselectFulltrainReceipt.run?.student_cache?.clips
        === 10335
      && recognizerRun6VerifselectFulltrainReceipt.run?.student_cache
        ?.sequence_length === 32
      && recognizerRun6VerifselectFulltrainReceipt.run?.feature_dim === 90
      && recognizerRun6VerifselectFulltrainReceipt.run?.train_clips === 7011
      && recognizerRun6VerifselectFulltrainReceipt.run?.monitor_clips === 955
      && recognizerRun6VerifselectFulltrainReceipt.run?.test_clips === 2369
      && recognizerRun6VerifselectFulltrainReceipt.run?.classes === 95
      && recognizerRun6VerifselectFulltrainReceipt.run?.epochs === 240
      && recognizerRun6VerifselectFulltrainReceipt.run?.optimizer_steps
        === 13200
      && recognizerRun6VerifselectFulltrainReceipt.run
        ?.expected_optimizer_steps === 13200
      && recognizerRun6VerifselectFulltrainReceipt.run?.history_len === 240
      && recognizerRun6VerifselectFulltrainReceipt.run?.supcon?.enabled
        === false
      && recognizerRun6VerifselectFulltrainReceipt.run
        ?.checkpoint_selection?.metric_name
        === "monitor_verification_recall_far10"
      && recognizerRun6VerifselectFulltrainReceipt.run
        ?.checkpoint_selection?.best_epoch === 14
      && recognizerRun6VerifselectFulltrainReceipt.run
        ?.checkpoint_selection?.checkpoint_written === true
      && recognizerRun6VerifselectFulltrainReceipt.run
        ?.best_monitor_verification_recall_far10 > 0.816
      && recognizerRun6VerifselectFulltrainReceipt.run?.test_top1 === 0.287
      && recognizerRun6VerifselectFulltrainReceipt.run?.test_top5 === 0.6399
      && recognizerRun6VerifselectFulltrainReceipt.run
        ?.verification_recall_at_far10 === 0.8039
      && recognizerRun6VerifselectFulltrainReceipt.comparison
        ?.run6_beats_running_best_primary_recall === true
      && recognizerRun6VerifselectFulltrainReceipt.comparison?.gate_cleared
        === false
      && recognizerRun6VerifselectFulltrainReceipt.artifacts?.sha256?.json
        === sha256(sideRecognizerRun6VerifselectFulltrainReceiptPath)
      && recognizerRun6VerifselectFulltrainReceipt.artifacts?.sha256
        ?.checkpoint === sha256(sideRecognizerRun6VerifselectFulltrainWeightsPath)
      && recognizerRun6VerifselectFulltrainReceipt.artifacts?.sha256?.log
        === sha256(sideRecognizerRun6VerifselectFulltrainLogPath)
      && recognizerRun6VerifselectFulltrainReceipt.artifacts
        ?.copyback_verified_by_hash === true
      && recognizerRun6VerifselectFulltrainReceipt.runtime_boundary
        ?.worker_final_status === "STOPPED"
      && recognizerRun6VerifselectFulltrainReceipt.runtime_boundary
        ?.worker_final_shell_status === "NOT READY"
      && recognizerRun6VerifselectFulltrainReceipt.runtime_boundary
        ?.worker_final_health_status === "HEALTHY"
      && recognizerRun6VerifselectFulltrainReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && recognizerRun6VerifselectFulltrainReceipt.runtime_boundary
        ?.raw_learner_video_upload === false
      && recognizerRun6VerifselectFulltrainReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun6VerifselectFulltrainReceipt.runtime_boundary
        ?.final_gate_changed === false
      && recognizerRun6VerifselectFulltrainReceipt.next_action?.token
        === recognizerRun6ResearchTuningNextAction,
    {
      path: recognizerRun6VerifselectFulltrainReceiptPath,
      status: recognizerRun6VerifselectFulltrainReceipt.status ?? null,
      worker: recognizerRun6VerifselectFulltrainReceipt.worker ?? null,
      sync: recognizerRun6VerifselectFulltrainReceipt.sync ?? null,
      remote_dry_run:
        recognizerRun6VerifselectFulltrainReceipt.remote_dry_run ?? null,
      run: recognizerRun6VerifselectFulltrainReceipt.run ?? null,
      comparison: recognizerRun6VerifselectFulltrainReceipt.comparison ?? null,
      artifacts: recognizerRun6VerifselectFulltrainReceipt.artifacts ?? null,
      runtime_boundary:
        recognizerRun6VerifselectFulltrainReceipt.runtime_boundary ?? null,
      next_action: recognizerRun6VerifselectFulltrainReceipt.next_action ?? null,
    },
    "recognizer run6 verification-selection fulltrain must record a completed full-data Brev run, matching copied artifact hashes, 13200 optimizer steps, best monitor-verification checkpoint selection, held-out recall improvement to 0.8039, fail-closed gate status, stopped worker, and no-Brev research tuning next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_research_tuning_selects_verification_tail_audit_no_brev",
    recognizerRun6ResearchTuningReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run6-research-tuning/v1"
      && recognizerRun6ResearchTuningReceipt.status
        === "completed_research_tuning_no_brev_no_training"
      && recognizerRun6ResearchTuningReceipt.slice
        === recognizerRun6ResearchTuningNextAction
      && recognizerRun6ResearchTuningReceipt.inputs?.run6_fulltrain_receipt
        === recognizerRun6VerifselectFulltrainReceiptPath
      && recognizerRun6ResearchTuningReceipt.inputs
        ?.run6_verification_margin_diagnostic
        === recognizerRun6VerificationMarginDiagnosticReceiptPath
      && recognizerRun6ResearchTuningReceipt.run6_summary?.sequence_length
        === 32
      && recognizerRun6ResearchTuningReceipt.run6_summary?.train_clips === 7011
      && recognizerRun6ResearchTuningReceipt.run6_summary?.monitor_clips
        === 955
      && recognizerRun6ResearchTuningReceipt.run6_summary?.test_clips === 2369
      && recognizerRun6ResearchTuningReceipt.run6_summary?.classes === 95
      && recognizerRun6ResearchTuningReceipt.run6_summary?.feature_dim === 90
      && recognizerRun6ResearchTuningReceipt.run6_summary
        ?.best_monitor_epoch === 14
      && recognizerRun6ResearchTuningReceipt.run6_summary
        ?.best_monitor_verification_recall_far10 === 0.8169
      && recognizerRun6ResearchTuningReceipt.run6_summary
        ?.final_epoch_monitor_verification_recall_far10 === 0.7835
      && recognizerRun6ResearchTuningReceipt.run6_summary
        ?.verification_recall_at_far10 === 0.8039
      && recognizerRun6ResearchTuningReceipt.run6_summary?.test_top1 === 0.287
      && recognizerRun6ResearchTuningReceipt.run6_summary?.test_top5 === 0.6399
      && recognizerRun6ResearchTuningReceipt.run6_summary
        ?.delta_vs_run4_verification_recall_at_far10 === 0.0413
      && recognizerRun6ResearchTuningReceipt.run6_summary
        ?.gap_to_gate_verification_recall_at_far10 === 0.0461
      && recognizerRun6ResearchTuningReceipt.run6_summary
        ?.top_failure_words?.[0]?.label === "give"
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.attempted === true
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.status === "blocked_no_browser_control_iab_tool_exposed"
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.used === true
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.route === "openai-api-research"
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.model_requested === "gpt-5.5"
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.response_id
        === "resp_0ded03e26cd18905006a21042a4e5081949efd9c2f60c581af"
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.status === "completed"
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.model_returned === "gpt-5.5-2026-04-23"
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.total_tokens === 8857
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.reasoning_tokens === 3106
      && exists(recognizerRun6ResearchTuningPromptFilePath)
      && exists(recognizerRun6ResearchTuningRequestFilePath)
      && exists(recognizerRun6ResearchTuningRawFilePath)
      && exists(recognizerRun6ResearchTuningResponseFilePath)
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.prompt_md
        === sha256(recognizerRun6ResearchTuningPromptFilePath)
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.request_json
        === sha256(recognizerRun6ResearchTuningRequestFilePath)
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.raw_json
        === sha256(recognizerRun6ResearchTuningRawFilePath)
      && recognizerRun6ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.response_md
        === sha256(recognizerRun6ResearchTuningResponseFilePath)
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.model_recommended_token
        === "implement_and_run_run6_verification_tail_audit_no_brev"
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.selected_next_action === recognizerRun7VerificationTailAuditNextAction
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.selected_preflight?.includes("verification-tail failure audit")
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.future_paid_run_if_audit_passes?.token
        === recognizerRun7ClassBalancedCeFulltrainNextAction
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.future_paid_run_if_audit_passes?.class_balanced_ce === true
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.future_paid_run_if_audit_passes?.class_balance_beta === 0.999
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.future_paid_run_if_audit_passes?.class_balance_max_weight === 4.0
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.future_paid_run_if_audit_passes?.checkpoint_metric
        === "monitor_verification_recall_far10"
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.future_paid_run_if_audit_passes?.expected_optimizer_steps === 13200
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.why_supcon_tuning_waits?.includes("Run5")
      && recognizerRun6ResearchTuningReceipt.research_conclusion
        ?.why_t40_waits?.includes("T=40")
      && recognizerRun6ResearchTuningReceipt.brev_visibility
        ?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.status === "STOPPED"
      && recognizerRun6ResearchTuningReceipt.brev_visibility
        ?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.health_status === "HEALTHY"
      && recognizerRun6ResearchTuningReceipt.boundaries?.brev_used === false
      && recognizerRun6ResearchTuningReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun6ResearchTuningReceipt.boundaries?.remote_mutation === false
      && recognizerRun6ResearchTuningReceipt.boundaries?.training_run === false
      && recognizerRun6ResearchTuningReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun6ResearchTuningReceipt.boundaries?.checkpoint_written
        === false
      && recognizerRun6ResearchTuningReceipt.boundaries?.runtime_export === false
      && recognizerRun6ResearchTuningReceipt.boundaries?.browser_promotion
        === false
      && recognizerRun6ResearchTuningReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun6ResearchTuningReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun6ResearchTuningReceipt.boundaries?.final_gate_changed
        === false
      && recognizerRun6ResearchTuningReceipt.next_action?.token
        === recognizerRun7VerificationTailAuditNextAction,
    {
      path: recognizerRun6ResearchTuningReceiptPath,
      status: recognizerRun6ResearchTuningReceipt.status ?? null,
      run6_summary: recognizerRun6ResearchTuningReceipt.run6_summary ?? null,
      research_escalation:
        recognizerRun6ResearchTuningReceipt.research_escalation ?? null,
      research_conclusion:
        recognizerRun6ResearchTuningReceipt.research_conclusion ?? null,
      brev_visibility:
        recognizerRun6ResearchTuningReceipt.brev_visibility ?? null,
      boundaries: recognizerRun6ResearchTuningReceipt.boundaries ?? null,
      next_action: recognizerRun6ResearchTuningReceipt.next_action ?? null,
    },
    "recognizer run6 research tuning must record GPT-Pro/browser unavailability, gpt-5.5 API fallback, artifact hashes, run6 metric diagnosis, selected no-Brev verification-tail audit, gated class-balanced run7 candidate, stopped Brev visibility, and no Brev/training boundary",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_verification_tail_audit_completed_no_brev",
    recognizerRun7VerificationTailDiagnosticReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-verification-tail-audit/v1"
      && recognizerRun7VerificationTailDiagnosticReceipt.status
        === "passed_no_training_verification_tail_audit"
      && recognizerRun7VerificationTailDiagnosticReceipt.diagnostic_kind
        === "verification_tail_audit"
      && recognizerRun7VerificationTailDiagnosticReceipt.actual_counts?.clips
        === 10335
      && recognizerRun7VerificationTailDiagnosticReceipt.actual_counts
        ?.train_clips === 7011
      && recognizerRun7VerificationTailDiagnosticReceipt.actual_counts
        ?.monitor_clips === 955
      && recognizerRun7VerificationTailDiagnosticReceipt.actual_counts
        ?.test_clips === 2369
      && recognizerRun7VerificationTailDiagnosticReceipt.actual_counts
        ?.classes === 95
      && recognizerRun7VerificationTailDiagnosticReceipt.actual_counts
        ?.sequence_length === 32
      && recognizerRun7VerificationTailDiagnosticReceipt.actual_counts
        ?.feature_dim === 90
      && Math.abs(
        recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6
          ?.reproduction?.computed_test_verification_recall_at_far10
          - 0.8038559556786704,
      ) < 1e-12
      && recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6
        ?.reproduction?.reported_test_verification_recall_at_far10 === 0.8039
      && recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6
        ?.reproduction?.abs_diff < 0.002
      && recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6
        ?.verification_tail_audit?.constraint_summary?.status === "not_proven"
      && recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6
        ?.verification_tail_audit?.constraint_summary
        ?.material_count_or_teacher_coverage_constraint_proven === false
      && recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6
        ?.verification_tail_audit?.constraint_summary
        ?.top_gap_classes_constrained === 5
      && recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6
        ?.verification_tail_audit?.test_gap_joined_with_counts?.[0]?.label
        === "give"
      && recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6?.test
        ?.tail_audit?.top_hard_negative_pairs?.[0]?.target_label === "hungry"
      && recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6?.test
        ?.tail_audit?.top_hard_negative_pairs?.[0]?.true_negative_label
        === "please"
      && recognizerRun7VerificationTailDiagnosticReceipt.boundaries?.brev_used
        === false
      && recognizerRun7VerificationTailDiagnosticReceipt.boundaries
        ?.training_run === false
      && recognizerRun7VerificationTailDiagnosticReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun7VerificationTailAuditReceipt.schema_version
        === "asl-pilot-m3jb-recognizer-transformer-run7-verification-tail-audit/v1"
      && recognizerRun7VerificationTailAuditReceipt.status
        === "completed_verification_tail_audit_no_brev_no_training"
      && recognizerRun7VerificationTailAuditReceipt.slice
        === recognizerRun7VerificationTailAuditNextAction
      && recognizerRun7VerificationTailAuditReceipt.inputs?.detail_audit_receipt
        === recognizerRun7VerificationTailDiagnosticReceiptPath
      && recognizerRun7VerificationTailAuditReceipt.inputs?.detail_audit_sha256
        === sha256(recognizerRun7VerificationTailDiagnosticReceiptFilePath)
      && recognizerRun7VerificationTailAuditReceipt.inputs
        ?.side_annotator_commit === "885477c614c97506839b8248f1c0f93d71cbb55c"
      && /^[a-f0-9]{64}$/.test(
        recognizerRun7VerificationTailAuditReceipt.inputs?.side_sha256
          ?.diagnose_verification_margins_py ?? "",
      )
      && /^[a-f0-9]{64}$/.test(
        recognizerRun7VerificationTailAuditReceipt.inputs?.side_sha256
          ?.test_verification_tail_audit_py ?? "",
      )
      && recognizerRun7VerificationTailAuditReceipt.tail_conclusion
        ?.material_count_or_teacher_coverage_constraint_proven === false
      && recognizerRun7VerificationTailAuditReceipt.tail_conclusion
        ?.constraint_status === "not_proven"
      && recognizerRun7VerificationTailAuditReceipt.tail_conclusion
        ?.top_gap_words?.[0]?.label === "give"
      && recognizerRun7VerificationTailAuditReceipt
        .future_paid_candidate_decision?.class_balanced_ce_fulltrain_selected
        === false
      && recognizerRun7VerificationTailAuditReceipt.next_action?.token
        === recognizerRun7HardNegativeObjectiveResearchNextAction
      && recognizerRun7VerificationTailAuditReceipt.boundaries?.brev_used
        === false
      && recognizerRun7VerificationTailAuditReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun7VerificationTailAuditReceipt.boundaries?.training_run
        === false
      && recognizerRun7VerificationTailAuditReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun7VerificationTailAuditReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun7VerificationTailAuditReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRun7VerificationTailAuditReceipt.boundaries
        ?.final_gate_changed === false,
    {
      summary_receipt: recognizerRun7VerificationTailAuditReceiptPath,
      detail_receipt: recognizerRun7VerificationTailDiagnosticReceiptPath,
      summary_status: recognizerRun7VerificationTailAuditReceipt.status ?? null,
      detail_status:
        recognizerRun7VerificationTailDiagnosticReceipt.status ?? null,
      reproduction:
        recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6
          ?.reproduction ?? null,
      constraint_summary:
        recognizerRun7VerificationTailDiagnosticReceipt.runs?.run6
          ?.verification_tail_audit?.constraint_summary ?? null,
      next_action: recognizerRun7VerificationTailAuditReceipt.next_action ?? null,
      boundaries: recognizerRun7VerificationTailAuditReceipt.boundaries ?? null,
    },
    "recognizer run7 verification-tail audit must reproduce run6 recall, join class counts and teacher coverage, record hard-negative score-tail evidence, reject class-balanced CE as not proven, and select a no-Brev next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_hard_negative_objective_research_selects_ovr_bce_preflight",
    recognizerRun7HardNegativeObjectiveResearchReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run7-hard-negative-objective-research/v1"
      && recognizerRun7HardNegativeObjectiveResearchReceipt.status
        === "completed_hard_negative_objective_research_no_brev_no_training"
      && recognizerRun7HardNegativeObjectiveResearchReceipt.slice
        === recognizerRun7HardNegativeObjectiveResearchNextAction
      && recognizerRun7HardNegativeObjectiveResearchReceipt.inputs
        ?.run7_verification_tail_summary_receipt
        === recognizerRun7VerificationTailAuditReceiptPath
      && recognizerRun7HardNegativeObjectiveResearchReceipt.inputs
        ?.run7_verification_tail_summary_sha256
        === sha256(recognizerRun7VerificationTailAuditReceiptFilePath)
      && recognizerRun7HardNegativeObjectiveResearchReceipt.inputs
        ?.run7_verification_tail_detail_receipt
        === recognizerRun7VerificationTailDiagnosticReceiptPath
      && recognizerRun7HardNegativeObjectiveResearchReceipt.inputs
        ?.run7_verification_tail_detail_sha256
        === sha256(recognizerRun7VerificationTailDiagnosticReceiptFilePath)
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .tail_evidence_summary?.constraint_status === "not_proven"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .tail_evidence_summary
        ?.material_count_or_teacher_coverage_constraint_proven === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .tail_evidence_summary?.top_gap_words?.[0]?.label === "give"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .tail_evidence_summary?.top_hard_negative_pairs?.[0]
        ?.target_label === "hungry"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.gpt_pro_web_attempt?.attempted === true
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.gpt_pro_web_attempt?.status
        === "blocked_no_browser_control_iab_tool_exposed"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.used === true
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.route === "openai-api-research"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.model_requested === "gpt-5.5"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.calls?.[0]?.response_id
        === "resp_01ecb85353047dea006a210c8ca0cc8197804703931d228b1d"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.calls?.[0]?.status === "completed"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.calls?.[0]?.model_returned
        === "gpt-5.5-2026-04-23"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.calls?.[0]?.total_tokens === 11645
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.calls?.[0]?.reasoning_tokens === 4422
      && exists(recognizerRun7HardNegativeObjectiveResearchPromptFilePath)
      && exists(recognizerRun7HardNegativeObjectiveResearchRequestFilePath)
      && exists(recognizerRun7HardNegativeObjectiveResearchRawFilePath)
      && exists(recognizerRun7HardNegativeObjectiveResearchResponseFilePath)
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.artifacts_sha256?.prompt_md
        === sha256(recognizerRun7HardNegativeObjectiveResearchPromptFilePath)
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.artifacts_sha256?.request_json
        === sha256(recognizerRun7HardNegativeObjectiveResearchRequestFilePath)
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.artifacts_sha256?.raw_json
        === sha256(recognizerRun7HardNegativeObjectiveResearchRawFilePath)
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_escalation?.fallback?.artifacts_sha256?.response_md
        === sha256(recognizerRun7HardNegativeObjectiveResearchResponseFilePath)
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.model_recommended_token
        === "run7-preflight-ovr-bce-hardneg-v1"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.selected_next_action
        === recognizerRun7OvrBceHardnegPreflightNextAction
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.selected_flags?.ovr_bce_weight_default === 0
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.selected_flags?.paid_run_ovr_bce_weight === 0.03
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.selected_flags?.ovr_bce_hard_k === 8
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.selected_flags?.ovr_bce_negative_source
        === "batch-labels"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.future_paid_run_if_preflight_passes?.token
        === recognizerRun7OvrBceHardnegFulltrainNextAction
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.future_paid_run_if_preflight_passes
        ?.expected_optimizer_steps === 13200
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.future_paid_run_if_preflight_passes
        ?.uses_test_mined_pairs_for_training === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.not_selected_next?.class_balanced_ce
        ?.includes("not_proven")
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .research_conclusion?.not_selected_next?.fixed_test_mined_pairs
        ?.includes("held-out")
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .brev_visibility?.workspaces?.["asl-pilot-m3eh-l40s-001"]?.status
        === "STOPPED"
      && recognizerRun7HardNegativeObjectiveResearchReceipt
        .brev_visibility?.workspaces?.["asl-pilot-m3eh-l40s-001"]
        ?.health_status === "HEALTHY"
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.brev_used === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.remote_mutation === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.training_run === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.runtime_export === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerRun7HardNegativeObjectiveResearchReceipt.next_action?.token
        === recognizerRun7OvrBceHardnegPreflightNextAction,
    {
      path: recognizerRun7HardNegativeObjectiveResearchReceiptPath,
      status: recognizerRun7HardNegativeObjectiveResearchReceipt.status ?? null,
      tail_evidence_summary:
        recognizerRun7HardNegativeObjectiveResearchReceipt
          .tail_evidence_summary ?? null,
      research_escalation:
        recognizerRun7HardNegativeObjectiveResearchReceipt
          .research_escalation ?? null,
      research_conclusion:
        recognizerRun7HardNegativeObjectiveResearchReceipt
          .research_conclusion ?? null,
      brev_visibility:
        recognizerRun7HardNegativeObjectiveResearchReceipt
          .brev_visibility ?? null,
      boundaries:
        recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries ?? null,
      next_action:
        recognizerRun7HardNegativeObjectiveResearchReceipt.next_action ?? null,
    },
    "recognizer run7 hard-negative objective research must record GPT-Pro/browser unavailability, gpt-5.5 API fallback, artifact hashes, OVR-BCE preflight selection, rejected class-balanced/fixed-test-pair routes, stopped Brev visibility, and no Brev/training boundaries",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_ovr_bce_hardneg_preflight_ready_for_paid_fulltrain",
    recognizerRun7OvrBceHardnegPreflightReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run7-ovr-bce-hardneg-preflight/v1"
      && recognizerRun7OvrBceHardnegPreflightReceipt.status
        === "completed_ovr_bce_hardneg_preflight_no_brev_no_training"
      && recognizerRun7OvrBceHardnegPreflightReceipt.slice
        === recognizerRun7OvrBceHardnegPreflightNextAction
      && recognizerRun7OvrBceHardnegPreflightReceipt.inputs
        ?.hard_negative_objective_research_receipt
        === recognizerRun7HardNegativeObjectiveResearchReceiptPath
      && recognizerRun7OvrBceHardnegPreflightReceipt.inputs
        ?.hard_negative_objective_research_sha256
        === sha256(recognizerRun7HardNegativeObjectiveResearchReceiptFilePath)
      && recognizerRun7OvrBceHardnegPreflightReceipt.inputs
        ?.zero_weight_dryrun_receipt
        === recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptPath
      && recognizerRun7OvrBceHardnegPreflightReceipt.inputs
        ?.zero_weight_dryrun_sha256
        === sha256(recognizerRun7OvrBceHardnegZeroWeightDryrunReceiptFilePath)
      && recognizerRun7OvrBceHardnegPreflightReceipt.inputs
        ?.weighted_dryrun_receipt
        === recognizerRun7OvrBceHardnegWeight003DryrunReceiptPath
      && recognizerRun7OvrBceHardnegPreflightReceipt.inputs
        ?.weighted_dryrun_sha256
        === sha256(recognizerRun7OvrBceHardnegWeight003DryrunReceiptFilePath)
      && recognizerRun7OvrBceHardnegPreflightReceipt.side_worktree
        ?.commit === "828f5cf5a23c1383bea8f0358dd98d4434e84f22"
      && recognizerRun7OvrBceHardnegPreflightReceipt.side_worktree
        ?.scoped_files_clean_after_side_commit === true
      && recognizerRun7OvrBceHardnegPreflightReceipt.implementation
        ?.flags_added?.includes("--ovr-bce-weight")
      && recognizerRun7OvrBceHardnegPreflightReceipt.implementation
        ?.flag_defaults?.ovr_bce_weight === 0
      && recognizerRun7OvrBceHardnegPreflightReceipt.implementation
        ?.active_preflight_flags?.ovr_bce_weight === 0.03
      && recognizerRun7OvrBceHardnegPreflightReceipt.implementation
        ?.negative_selection?.source === "batch-labels"
      && recognizerRun7OvrBceHardnegPreflightReceipt.implementation
        ?.negative_selection?.uses_test_mined_pairs_for_training === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.zero_weight_dryrun
        ?.dry_run_forward?.base_loss_equals_total_loss === true
      && recognizerRun7OvrBceHardnegPreflightReceipt.zero_weight_dryrun
        ?.dry_run_forward?.ovr_bce_enabled === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.weighted_ovr_bce_dryrun
        ?.dry_run_forward?.base_loss_matches_zero_weight === true
      && recognizerRun7OvrBceHardnegPreflightReceipt.weighted_ovr_bce_dryrun
        ?.dry_run_forward?.ovr_bce?.enabled === true
      && recognizerRun7OvrBceHardnegPreflightReceipt.weighted_ovr_bce_dryrun
        ?.dry_run_forward?.ovr_bce?.weight === 0.03
      && recognizerRun7OvrBceHardnegPreflightReceipt.weighted_ovr_bce_dryrun
        ?.dry_run_forward?.ovr_bce?.hard_k === 8
      && recognizerRun7OvrBceHardnegPreflightReceipt.weighted_ovr_bce_dryrun
        ?.dry_run_forward?.ovr_bce?.selected_negative_count === 1024
      && recognizerRun7OvrBceHardnegPreflightReceipt.weighted_ovr_bce_dryrun
        ?.dry_run_forward?.ovr_bce?.selected_negative_matches_true_label === 0
      && recognizerRun7OvrBceHardnegPreflightReceipt.weighted_ovr_bce_dryrun
        ?.dry_run_forward?.ovr_bce?.uses_test_mined_pairs_for_training === false
      && recognizerRun7OvrBceHardnegZeroWeightDryrunReceipt.training_mode
        === "dry_run_forward"
      && recognizerRun7OvrBceHardnegWeight003DryrunReceipt.training_mode
        === "dry_run_forward"
      && recognizerRun7OvrBceHardnegZeroWeightDryrunReceipt
        .dry_run_forward?.optimizer_steps === 0
      && recognizerRun7OvrBceHardnegWeight003DryrunReceipt
        .dry_run_forward?.optimizer_steps === 0
      && recognizerRun7OvrBceHardnegZeroWeightDryrunReceipt.weights === null
      && recognizerRun7OvrBceHardnegWeight003DryrunReceipt.weights === null
      && recognizerRun7OvrBceHardnegZeroWeightDryrunReceipt
        .dry_run_forward?.loss_components?.ovr_bce?.enabled === false
      && recognizerRun7OvrBceHardnegWeight003DryrunReceipt
        .dry_run_forward?.loss_components?.ovr_bce?.enabled === true
      && recognizerRun7OvrBceHardnegWeight003DryrunReceipt
        .dry_run_forward?.loss_components?.ovr_bce
        ?.selected_negative_matches_true_label === 0
      && recognizerRun7OvrBceHardnegWeight003DryrunReceipt
        .dry_run_forward?.loss_components?.ovr_bce
        ?.uses_test_mined_pairs_for_training === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.boundaries
        ?.brev_used === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.boundaries
        ?.training_run === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.boundaries
        ?.runtime_export === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerRun7OvrBceHardnegPreflightReceipt.next_action?.token
        === recognizerRun7OvrBceHardnegFulltrainNextAction,
    {
      path: recognizerRun7OvrBceHardnegPreflightReceiptPath,
      side_worktree:
        recognizerRun7OvrBceHardnegPreflightReceipt.side_worktree ?? null,
      zero_weight_dryrun:
        recognizerRun7OvrBceHardnegPreflightReceipt.zero_weight_dryrun ?? null,
      weighted_ovr_bce_dryrun:
        recognizerRun7OvrBceHardnegPreflightReceipt
          .weighted_ovr_bce_dryrun ?? null,
      next_action:
        recognizerRun7OvrBceHardnegPreflightReceipt.next_action ?? null,
      boundaries:
        recognizerRun7OvrBceHardnegPreflightReceipt.boundaries ?? null,
    },
    "recognizer run7 OVR-BCE hard-negative preflight must prove default-off parity, finite active batch-local negatives, no test-mined training pairs, zero optimizer/backward steps, no checkpoint/export/browser side effects, and select the gated paid fulltrain next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_ovr_bce_hardneg_fulltrain_completed_fail_closed",
    recognizerRun7OvrBceHardnegFulltrainReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-fulltrain-run7-ovr-bce-hardneg-brev/v1"
      && recognizerRun7OvrBceHardnegFulltrainReceipt.status
        === "completed_rejected_fail_closed_below_gate_regressed_vs_running_best"
      && recognizerRun7OvrBceHardnegFulltrainReceipt.slice
        === recognizerRun7OvrBceHardnegFulltrainNextAction
      && recognizerRun7OvrBceHardnegFulltrainReceipt.source_of_truth
        ?.previous_preflight_receipt
        === recognizerRun7OvrBceHardnegPreflightReceiptPath
      && recognizerRun7OvrBceHardnegFulltrainReceipt.source_of_truth
        ?.side_worktree_commit_synced
        === "828f5cf5a23c1383bea8f0358dd98d4434e84f22"
      && recognizerRun7OvrBceHardnegFulltrainReceipt.approval
        ?.source === "GOAL.md and active prompt"
      && recognizerRun7OvrBceHardnegFulltrainReceipt.worker
        ?.remote_preflight?.ssh_probe_passed_attempt === 3
      && recognizerRun7OvrBceHardnegFulltrainReceipt.worker
        ?.remote_preflight?.cuda_available === true
      && recognizerRun7OvrBceHardnegFulltrainReceipt.worker
        ?.remote_preflight?.gpu_name === "NVIDIA L40S"
      && recognizerRun7OvrBceHardnegFulltrainReceipt.worker
        ?.remote_preflight?.conflicting_training_process_found === false
      && recognizerRun7OvrBceHardnegFulltrainReceipt.worker
        ?.final_brev_ls?.retained?.status === "STOPPED"
      && recognizerRun7OvrBceHardnegFulltrainReceipt.worker
        ?.final_brev_ls?.retained?.shell_status === "NOT READY"
      && recognizerRun7OvrBceHardnegFulltrainReceipt.worker
        ?.final_brev_ls?.retained?.health_status === "HEALTHY"
      && recognizerRun7OvrBceHardnegFulltrainReceipt.sync
        ?.remote_hashes_match_local === true
      && recognizerRun7OvrBceHardnegFulltrainReceipt.sync
        ?.local_hashes?.["train_recognizer_distill.py"]
        === "62a1c272497b581341852afc7dbbeb26b67fc8885d9d36ba27c543ea957ae8f4"
      && recognizerRun7OvrBceHardnegFulltrainReceipt.remote_dry_run
        ?.receipt_sha256
        === "654a9b856c07aca8f8c65e11688709797e88f623f588c05ca2873a6868f7d8ad"
      && exists(recognizerRun7OvrBceHardnegDryrunArtifactFilePath)
      && sha256(recognizerRun7OvrBceHardnegDryrunArtifactFilePath)
        === recognizerRun7OvrBceHardnegFulltrainReceipt.remote_dry_run
          ?.receipt_sha256
      && recognizerRun7OvrBceHardnegFulltrainReceipt.remote_dry_run
        ?.logits_shape?.[0] === 128
      && recognizerRun7OvrBceHardnegFulltrainReceipt.remote_dry_run
        ?.logits_shape?.[1] === 95
      && recognizerRun7OvrBceHardnegFulltrainReceipt.remote_dry_run
        ?.ovr_bce?.weight === 0.03
      && recognizerRun7OvrBceHardnegFulltrainReceipt.remote_dry_run
        ?.ovr_bce?.selected_negative_matches_true_label === 0
      && recognizerRun7OvrBceHardnegFulltrainReceipt.remote_dry_run
        ?.ovr_bce?.uses_test_mined_pairs_for_training === false
      && recognizerRun7OvrBceHardnegFulltrainReceipt.remote_dry_run
        ?.optimizer_steps === 0
      && recognizerRun7OvrBceHardnegFulltrainReceipt
        .aborted_launch_correction?.occurred === true
      && recognizerRun7OvrBceHardnegFulltrainReceipt
        .aborted_launch_correction?.remote_process_killed === true
      && recognizerRun7OvrBceHardnegFulltrainReceipt
        .aborted_launch_correction?.accepted_run_command_relaunched_after_process_check
        === true
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.full_data_no_limit_flags === true
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.train_clips === 7011
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.monitor_clips === 955
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run?.test_clips
        === 2369
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run?.classes === 95
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.sequence_length === 32
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.feature_dim === 90
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run?.epochs === 240
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run?.batch === 128
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.checkpoint_selection?.metric_name
        === "monitor_verification_recall_far10"
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.checkpoint_selection?.best_epoch === 24
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.checkpoint_selection?.checkpoint_written === true
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.optimizer_steps === 13200
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.expected_optimizer_steps === 13200
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.ovr_bce?.weight === 0.03
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.ovr_bce?.selected_negative_matches_true_label === 0
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.ovr_bce?.uses_test_mined_pairs_for_training === false
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run?.test_top1
        === 0.2913
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run?.test_top5
        === 0.6167
      && recognizerRun7OvrBceHardnegFulltrainReceipt.run
        ?.verification_recall_at_far10 === 0.7759
      && recognizerRun7OvrBceHardnegFulltrainReceipt.comparison
        ?.run7_beats_running_best_primary_recall === false
      && recognizerRun7OvrBceHardnegFulltrainReceipt.comparison
        ?.gate_cleared === false
      && exists(recognizerRun7OvrBceHardnegFulltrainJsonArtifactFilePath)
      && exists(recognizerRun7OvrBceHardnegFulltrainPtArtifactFilePath)
      && exists(recognizerRun7OvrBceHardnegFulltrainLogArtifactFilePath)
      && sha256(recognizerRun7OvrBceHardnegFulltrainJsonArtifactFilePath)
        === recognizerRun7OvrBceHardnegFulltrainReceipt.artifacts
          ?.sha256?.fulltrain_json
      && sha256(recognizerRun7OvrBceHardnegFulltrainPtArtifactFilePath)
        === recognizerRun7OvrBceHardnegFulltrainReceipt.artifacts
          ?.sha256?.fulltrain_pt
      && sha256(recognizerRun7OvrBceHardnegFulltrainLogArtifactFilePath)
        === recognizerRun7OvrBceHardnegFulltrainReceipt.artifacts
          ?.sha256?.fulltrain_log
      && recognizerRun7OvrBceHardnegFulltrainReceipt.boundaries
        ?.brev_used === true
      && recognizerRun7OvrBceHardnegFulltrainReceipt.boundaries
        ?.training_run === true
      && recognizerRun7OvrBceHardnegFulltrainReceipt.boundaries
        ?.checkpoint_written === true
      && recognizerRun7OvrBceHardnegFulltrainReceipt.boundaries
        ?.runtime_export === false
      && recognizerRun7OvrBceHardnegFulltrainReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRun7OvrBceHardnegFulltrainReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun7OvrBceHardnegFulltrainReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun7OvrBceHardnegFulltrainReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerRun7OvrBceHardnegFulltrainReceipt.next_action?.token
        === recognizerRun7OvrBceResearchTuningNextAction,
    {
      path: recognizerRun7OvrBceHardnegFulltrainReceiptPath,
      worker: recognizerRun7OvrBceHardnegFulltrainReceipt.worker ?? null,
      sync: recognizerRun7OvrBceHardnegFulltrainReceipt.sync ?? null,
      remote_dry_run:
        recognizerRun7OvrBceHardnegFulltrainReceipt.remote_dry_run ?? null,
      aborted_launch_correction:
        recognizerRun7OvrBceHardnegFulltrainReceipt
          .aborted_launch_correction ?? null,
      run: recognizerRun7OvrBceHardnegFulltrainReceipt.run ?? null,
      comparison: recognizerRun7OvrBceHardnegFulltrainReceipt.comparison ?? null,
      artifacts: recognizerRun7OvrBceHardnegFulltrainReceipt.artifacts ?? null,
      boundaries:
        recognizerRun7OvrBceHardnegFulltrainReceipt.boundaries ?? null,
      next_action:
        recognizerRun7OvrBceHardnegFulltrainReceipt.next_action ?? null,
    },
    "recognizer run7 OVR-BCE hard-negative fulltrain must record healthy Brev preflight, scoped sync, safe CUDA dry-run, full-data training with 13200 steps, copied artifact hashes, stopped worker, fail-closed regression versus run6, and no-Brev research next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_ovr_bce_research_tuning_selects_paired_calibration_audit_no_brev",
    recognizerRun7OvrBceResearchTuningReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run7-ovr-bce-research-tuning/v1"
      && recognizerRun7OvrBceResearchTuningReceipt.status
        === "completed_ovr_bce_postmortem_no_brev_no_training"
      && recognizerRun7OvrBceResearchTuningReceipt.slice
        === recognizerRun7OvrBceResearchTuningNextAction
      && recognizerRun7OvrBceResearchTuningReceipt.inputs
        ?.run6_fulltrain_receipt
        === recognizerRun6VerifselectFulltrainReceiptPath
      && recognizerRun7OvrBceResearchTuningReceipt.inputs
        ?.run7_ovr_bce_fulltrain_receipt
        === recognizerRun7OvrBceHardnegFulltrainReceiptPath
      && recognizerRun7OvrBceResearchTuningReceipt.run6_vs_run7_summary
        ?.run6?.test_verification_recall_at_far10 === 0.8039
      && recognizerRun7OvrBceResearchTuningReceipt.run6_vs_run7_summary
        ?.run7_ovr_bce?.test_verification_recall_at_far10 === 0.7759
      && recognizerRun7OvrBceResearchTuningReceipt.run6_vs_run7_summary
        ?.delta_run7_minus_run6?.test_verification_recall_at_far10 === -0.028
      && recognizerRun7OvrBceResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.status
        === "blocked_no_browser_control_iab_tool_exposed"
      && recognizerRun7OvrBceResearchTuningReceipt.research_escalation
        ?.fallback?.used === true
      && recognizerRun7OvrBceResearchTuningReceipt.research_escalation
        ?.fallback?.route === "openai-api-research"
      && recognizerRun7OvrBceResearchTuningReceipt.research_escalation
        ?.fallback?.model_requested === "gpt-5.5"
      && recognizerRun7OvrBceResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.response_id
        === "resp_077b7bdd7c4483eb006a211f48d0ec81979b381333045daf88"
      && recognizerRun7OvrBceResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.status === "completed"
      && recognizerRun7OvrBceResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.model_returned === "gpt-5.5-2026-04-23"
      && recognizerRun7OvrBceResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.total_tokens === 9375
      && recognizerRun7OvrBceResearchTuningReceipt.research_conclusion
        ?.selected_next_action
        === recognizerRun6VsRun7CalibrationAuditNextAction
      && recognizerRun7OvrBceResearchTuningReceipt.research_conclusion
        ?.future_paid_run_if_audit_passes?.token
        === recognizerRun8OvrBceW001FulltrainNextAction
      && recognizerRun7OvrBceResearchTuningReceipt.research_conclusion
        ?.future_paid_run_if_audit_passes?.ovr_bce_weight === 0.01
      && recognizerRun7OvrBceResearchTuningReceipt.research_conclusion
        ?.future_paid_run_if_audit_passes?.uses_test_mined_pairs_for_training
        === false
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries?.brev_used
        === false
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries
        ?.brev_read_only_visibility === true
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries
        ?.training_run === false
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries
        ?.runtime_export === false
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun7OvrBceResearchTuningReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerRun7OvrBceResearchTuningReceipt.next_action?.token
        === recognizerRun6VsRun7CalibrationAuditNextAction
      && exists(recognizerRun7OvrBceResearchTuningPromptFilePath)
      && exists(recognizerRun7OvrBceResearchTuningRequestFilePath)
      && exists(recognizerRun7OvrBceResearchTuningRawFilePath)
      && exists(recognizerRun7OvrBceResearchTuningResponseFilePath)
      && sha256(recognizerRun7OvrBceResearchTuningPromptFilePath)
        === recognizerRun7OvrBceResearchTuningReceipt.research_escalation
          ?.fallback?.artifacts_sha256?.prompt_md
      && sha256(recognizerRun7OvrBceResearchTuningRequestFilePath)
        === recognizerRun7OvrBceResearchTuningReceipt.research_escalation
          ?.fallback?.artifacts_sha256?.request_json
      && sha256(recognizerRun7OvrBceResearchTuningRawFilePath)
        === recognizerRun7OvrBceResearchTuningReceipt.research_escalation
          ?.fallback?.artifacts_sha256?.raw_json
      && sha256(recognizerRun7OvrBceResearchTuningResponseFilePath)
        === recognizerRun7OvrBceResearchTuningReceipt.research_escalation
          ?.fallback?.artifacts_sha256?.response_md,
    {
      path: recognizerRun7OvrBceResearchTuningReceiptPath,
      run6_vs_run7_summary:
        recognizerRun7OvrBceResearchTuningReceipt.run6_vs_run7_summary ?? null,
      research_escalation:
        recognizerRun7OvrBceResearchTuningReceipt.research_escalation ?? null,
      research_conclusion:
        recognizerRun7OvrBceResearchTuningReceipt.research_conclusion ?? null,
      brev_visibility:
        recognizerRun7OvrBceResearchTuningReceipt.brev_visibility ?? null,
      boundaries:
        recognizerRun7OvrBceResearchTuningReceipt.boundaries ?? null,
      next_action:
        recognizerRun7OvrBceResearchTuningReceipt.next_action ?? null,
    },
    "recognizer run7 OVR-BCE research tuning must record GPT-Pro/browser unavailability, gpt-5.5 API fallback, artifact hashes, run6-vs-run7 calibration diagnosis, no-Brev/no-training boundaries, and select the paired calibration audit next action before any paid run8",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_vs_run7_paired_calibration_audit_records_reproduction_blocker",
    recognizerRun6VsRun7CalibrationAuditReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run6-vs-run7-paired-calibration-audit/v1"
      && recognizerRun6VsRun7CalibrationAuditReceipt.status
        === "completed_failed_reproduction_tolerance_no_brev_no_training"
      && recognizerRun6VsRun7CalibrationAuditReceipt.slice
        === recognizerRun6VsRun7CalibrationAuditNextAction
      && recognizerRun6VsRun7CalibrationAuditReceipt.side_worktree
        ?.commit === "bfd1e783"
      && recognizerRun6VsRun7CalibrationAuditReceipt.inputs
        ?.detailed_audit_receipt
        === recognizerRun6VsRun7CalibrationDetailedReceiptPath
      && exists(recognizerRun6VsRun7CalibrationDetailedReceiptFilePath)
      && sha256(recognizerRun6VsRun7CalibrationDetailedReceiptFilePath)
        === recognizerRun6VsRun7CalibrationAuditReceipt.inputs
          ?.detailed_audit_sha256
      && recognizerRun6VsRun7CalibrationDetailedReceipt.schema_version
        === "asl-pilot-m3jb-recognizer-paired-verification-calibration-audit/v1"
      && recognizerRun6VsRun7CalibrationDetailedReceipt.status === "failed"
      && recognizerRun6VsRun7CalibrationDetailedReceipt.counts_match_expected
        === true
      && recognizerRun6VsRun7CalibrationDetailedReceipt.runs
        ?.run6?.split_policy?.seed === 0
      && recognizerRun6VsRun7CalibrationDetailedReceipt.runs
        ?.run7?.split_policy?.seed === 1337
      && recognizerRun6VsRun7CalibrationAuditReceipt.reproduction
        ?.run6_test?.within_tolerance === true
      && recognizerRun6VsRun7CalibrationAuditReceipt.reproduction
        ?.run7_test?.computed_test_verification_recall_at_far10
        === 0.7750692520775622
      && recognizerRun6VsRun7CalibrationAuditReceipt.reproduction
        ?.run7_test?.within_tolerance === false
      && recognizerRun6VsRun7CalibrationAuditReceipt.reproduction
        ?.run7_test?.abs_diff === 0.0008307479224378689
      && recognizerRun6VsRun7CalibrationAuditReceipt.reproduction
        ?.run6_monitor?.within_tolerance === true
      && recognizerRun6VsRun7CalibrationAuditReceipt.reproduction
        ?.run7_monitor?.within_tolerance === true
      && recognizerRun6VsRun7CalibrationAuditReceipt
        .paired_calibration_audit?.monitor_vs_test_behavior
        ?.verification_recall_opposite_direction === true
      && recognizerRun6VsRun7CalibrationAuditReceipt
        .paired_calibration_audit?.calibration_damage_conclusion
        ?.positive_margin_calibration_damage_confirmed === true
      && recognizerRun6VsRun7CalibrationAuditReceipt.decision?.audit_passed
        === false
      && recognizerRun6VsRun7CalibrationAuditReceipt.decision
        ?.paid_run8_authorized_by_this_slice === false
      && recognizerRun6VsRun7CalibrationAuditReceipt.next_action?.token
        === recognizerRun7TestRecallReproductionDiscrepancyNextAction
      && recognizerRun6VsRun7CalibrationAuditReceipt.boundaries?.brev_used
        === false
      && recognizerRun6VsRun7CalibrationAuditReceipt.boundaries
        ?.training_run === false
      && recognizerRun6VsRun7CalibrationAuditReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun6VsRun7CalibrationAuditReceipt.boundaries
        ?.final_gate_changed === false,
    {
      path: recognizerRun6VsRun7CalibrationAuditReceiptPath,
      detailed_path: recognizerRun6VsRun7CalibrationDetailedReceiptPath,
      reproduction: recognizerRun6VsRun7CalibrationAuditReceipt.reproduction ?? null,
      paired_calibration_audit:
        recognizerRun6VsRun7CalibrationAuditReceipt.paired_calibration_audit ?? null,
      decision: recognizerRun6VsRun7CalibrationAuditReceipt.decision ?? null,
      next_action: recognizerRun6VsRun7CalibrationAuditReceipt.next_action ?? null,
      boundaries: recognizerRun6VsRun7CalibrationAuditReceipt.boundaries ?? null,
    },
    "recognizer run6-vs-run7 paired calibration audit must record no-Brev/no-training execution, reproduced monitor scores, failed run7 local test-recall tolerance, confirmed calibration damage, no run8 authorization, and no-Brev discrepancy next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run7_test_recall_reproduction_discrepancy_resolved",
    recognizerRun7TestRecallReproductionDiscrepancyReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run7-test-recall-reproduction-discrepancy-audit/v1"
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.status
        === "completed_resolved_no_brev_no_training"
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.slice
        === recognizerRun7TestRecallReproductionDiscrepancyNextAction
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.inputs
        ?.run7_fulltrain_receipt === recognizerRun7OvrBceHardnegFulltrainReceiptPath
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.inputs
        ?.paired_calibration_summary_receipt
        === recognizerRun6VsRun7CalibrationAuditReceiptPath
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.inputs
        ?.paired_calibration_detailed_receipt
        === recognizerRun6VsRun7CalibrationDetailedReceiptPath
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.inputs
        ?.run7_fulltrain_receipt_sha256
        === sha256(recognizerRun7OvrBceHardnegFulltrainReceiptFilePath)
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.inputs
        ?.paired_calibration_summary_receipt_sha256
        === sha256(recognizerRun6VsRun7CalibrationAuditReceiptFilePath)
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.inputs
        ?.paired_calibration_detailed_receipt_sha256
        === sha256(recognizerRun6VsRun7CalibrationDetailedReceiptFilePath)
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .provenance_checks?.run7_original_cuda_exact_test_recall
        === 0.7759113573407201
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .provenance_checks?.run7_original_cuda_monitor_selected_checkpoint_recall
        === 0.8275977981037635
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .local_recompute?.computed_test_verification_recall_at_far10
        === 0.7750692520775622
      && Math.abs(
        recognizerRun7TestRecallReproductionDiscrepancyReceipt.local_recompute
          ?.diff_from_original_cuda_exact - 0.0008421052631579,
      ) < 1e-15
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .local_recompute?.monitor_selected_checkpoint_diff_from_original_cuda === 0
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .class_level_delta?.classes_with_different_recall === 2
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .class_level_delta?.classes_with_equal_recall === 93
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .class_level_delta?.two_single_positive_flips_explain_full_mean_delta
        === true
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .class_level_delta?.differing_classes?.[0]?.label === "not"
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .class_level_delta?.differing_classes?.[0]?.recall_delta_local_minus_cuda
        === -0.04
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .class_level_delta?.differing_classes?.[1]?.label === "see"
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt
        .class_level_delta?.differing_classes?.[1]?.recall_delta_local_minus_cuda
        === -0.04
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.resolution
        ?.determination === "resolved_as_device_numeric_boundary_sensitivity"
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.resolution
        ?.original_cuda_receipt_authoritative_for_run7_test_recall === true
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.resolution
        ?.paired_calibration_damage_conclusion_still_supported === true
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.decision
        ?.discrepancy_resolved === true
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.decision
        ?.paid_run8_launched === false
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.decision
        ?.paid_run8_authorized_by_this_slice === false
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.decision
        ?.final_gate_changed === false
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.decision
        ?.prompt_target_changed === false
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.next_action
        ?.token === recognizerRun8OvrBceW001PreflightNextAction
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.boundaries
        ?.brev_used === false
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.boundaries
        ?.training_run === false
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun7TestRecallReproductionDiscrepancyReceipt.boundaries
        ?.final_gate_changed === false,
    {
      path: recognizerRun7TestRecallReproductionDiscrepancyReceiptPath,
      provenance:
        recognizerRun7TestRecallReproductionDiscrepancyReceipt.provenance_checks ?? null,
      local_recompute:
        recognizerRun7TestRecallReproductionDiscrepancyReceipt.local_recompute ?? null,
      class_level_delta:
        recognizerRun7TestRecallReproductionDiscrepancyReceipt.class_level_delta ?? null,
      resolution:
        recognizerRun7TestRecallReproductionDiscrepancyReceipt.resolution ?? null,
      decision:
        recognizerRun7TestRecallReproductionDiscrepancyReceipt.decision ?? null,
      next_action:
        recognizerRun7TestRecallReproductionDiscrepancyReceipt.next_action ?? null,
    },
    "recognizer run7 discrepancy audit must resolve the local-vs-CUDA test recall mismatch as exactly two class-level threshold-boundary flips, preserve no-Brev/no-training/final-gate boundaries, and select the no-Brev run8 w0.01 preflight next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run8_ovr_bce_w001_preflight_records_no_brev_dryrun",
    recognizerRun8OvrBceW001PreflightReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run8-ovr-bce-w001-preflight/v1"
      && recognizerRun8OvrBceW001PreflightReceipt.status
        === "completed_run8_ovr_bce_w001_preflight_no_brev_no_training"
      && recognizerRun8OvrBceW001PreflightReceipt.slice
        === recognizerRun8OvrBceW001PreflightNextAction
      && recognizerRun8OvrBceW001PreflightReceipt.side_worktree
        ?.commit_short === "bfd1e783"
      && recognizerRun8OvrBceW001PreflightReceipt.inputs
        ?.run8_dryrun_receipt === recognizerRun8OvrBceW001DryrunReceiptPath
      && exists(recognizerRun8OvrBceW001DryrunReceiptFilePath)
      && recognizerRun8OvrBceW001PreflightReceipt.inputs
        ?.run8_dryrun_receipt_sha256
        === sha256(recognizerRun8OvrBceW001DryrunReceiptFilePath)
      && recognizerRun8OvrBceW001DryrunReceipt.training_mode
        === "dry_run_forward"
      && recognizerRun8OvrBceW001DryrunReceipt.student_cache?.clips === 10335
      && recognizerRun8OvrBceW001DryrunReceipt.student_cache?.classes === 95
      && recognizerRun8OvrBceW001DryrunReceipt.student_cache?.sequence_length
        === 32
      && recognizerRun8OvrBceW001DryrunReceipt.train_clips === 7011
      && recognizerRun8OvrBceW001DryrunReceipt.monitor_clips === 955
      && recognizerRun8OvrBceW001DryrunReceipt.test_clips === 2369
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.logits_shape?.[0] === 128
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.logits_shape?.[1] === 95
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.loss_components?.base_loss === 7.84514
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.loss_components?.ovr_bce?.enabled === true
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.loss_components?.ovr_bce?.weight === 0.01
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.loss_components?.ovr_bce?.loss === 1.569024
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.loss_components?.ovr_bce?.weighted_loss === 0.01569
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.loss_components?.ovr_bce?.selected_negative_count === 1024
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.loss_components?.ovr_bce?.selected_negative_matches_true_label === 0
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.loss_components?.ovr_bce?.uses_test_mined_pairs_for_training === false
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.optimizer_constructed === false
      && recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward
        ?.backward_called === false
      && recognizerRun8OvrBceW001DryrunReceipt.optimizer_steps === 0
      && recognizerRun8OvrBceW001DryrunReceipt.expected_optimizer_steps === 0
      && recognizerRun8OvrBceW001DryrunReceipt.planned_optimizer_steps === 13200
      && recognizerRun8OvrBceW001DryrunReceipt.weights === null
      && recognizerRun8OvrBceW001DryrunReceipt.checkpoint_selection
        ?.metric_name === "monitor_verification_recall_far10"
      && recognizerRun8OvrBceW001DryrunReceipt.checkpoint_selection
        ?.checkpoint_written === false
      && recognizerRun8OvrBceW001PreflightReceipt
        .comparison_against_run7_weight003_preflight
        ?.base_loss_unchanged === true
      && recognizerRun8OvrBceW001PreflightReceipt
        .comparison_against_run7_weight003_preflight
        ?.ovr_bce_loss_unchanged === true
      && recognizerRun8OvrBceW001PreflightReceipt
        .comparison_against_run7_weight003_preflight
        ?.run8_weighted_loss === 0.01569
      && recognizerRun8OvrBceW001PreflightReceipt.brev_visibility
        ?.mode === "read_only"
      && recognizerRun8OvrBceW001PreflightReceipt.brev_visibility
        ?.lifecycle_command_run === false
      && recognizerRun8OvrBceW001PreflightReceipt.brev_visibility
        ?.remote_exec_run === false
      && recognizerRun8OvrBceW001PreflightReceipt.brev_visibility
        ?.workspaces?.every((workspace) => workspace.status === "STOPPED")
      && recognizerRun8OvrBceW001PreflightReceipt.future_run8_envelope
        ?.next_action === recognizerRun8OvrBceW001FulltrainNextAction
      && recognizerRun8OvrBceW001PreflightReceipt.future_run8_envelope
        ?.command_not_run_this_slice?.includes("--ovr-bce-weight 0.01")
      && recognizerRun8OvrBceW001PreflightReceipt.boundaries?.brev_used
        === false
      && recognizerRun8OvrBceW001PreflightReceipt.boundaries?.training_run
        === false
      && recognizerRun8OvrBceW001PreflightReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun8OvrBceW001PreflightReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerRun8OvrBceW001PreflightReceipt.next_action?.token
        === recognizerRun8OvrBceW001FulltrainNextAction,
    {
      path: recognizerRun8OvrBceW001PreflightReceiptPath,
      dryrun_path: recognizerRun8OvrBceW001DryrunReceiptPath,
      dryrun_sha256: exists(recognizerRun8OvrBceW001DryrunReceiptFilePath)
        ? sha256(recognizerRun8OvrBceW001DryrunReceiptFilePath)
        : null,
      dry_run_forward:
        recognizerRun8OvrBceW001DryrunReceipt.dry_run_forward ?? null,
      comparison:
        recognizerRun8OvrBceW001PreflightReceipt
          .comparison_against_run7_weight003_preflight ?? null,
      brev_visibility:
        recognizerRun8OvrBceW001PreflightReceipt.brev_visibility ?? null,
      future_run8_envelope:
        recognizerRun8OvrBceW001PreflightReceipt.future_run8_envelope ?? null,
      boundaries:
        recognizerRun8OvrBceW001PreflightReceipt.boundaries ?? null,
      next_action: recognizerRun8OvrBceW001PreflightReceipt.next_action ?? null,
    },
    "recognizer run8 OVR-BCE w0.01 preflight must record a local no-Brev dry-run with T32 counts, finite batch-local OVR-BCE loss, zero optimizer/backward/checkpoint, stopped Brev visibility, and the bounded fulltrain next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run8_ovr_bce_w001_brev_preflight_blocker_records_no_training_teardown",
    recognizerRun8OvrBceW001PreflightBlockerReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run8-ovr-bce-w001-brev-preflight-blocker/v1"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.status
        === "blocked_ssh_preflight_then_late_worker_recovered_no_training"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.slice
        === recognizerRun8OvrBceW001FulltrainNextAction
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.inputs
        ?.preflight_receipt === recognizerRun8OvrBceW001PreflightReceiptPath
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.inputs
        ?.accepted_dryrun_receipt === recognizerRun8OvrBceW001DryrunReceiptPath
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.approval
        ?.recorded_in_goal_and_active_prompt === true
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.approval
        ?.bounded_to_run8_preflight_receipt_envelope === true
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.approval
        ?.infrastructure_create_delete_reset_repair_approved === false
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.worker
        ?.name === "asl-pilot-m3eh-l40s-001"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.worker?.id
        === "3d58wpy9o"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.start?.exit_code === 0
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.ssh_cuda_process_preflight?.exit_code === 124
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.ssh_cuda_process_preflight?.result === "ssh_preflight_failed"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.ssh_cuda_process_preflight?.attempts?.length === 5
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.ssh_cuda_process_preflight?.attempts
          ?.every((attempt) => attempt.ssh_result === "timed_out")
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.ssh_cuda_process_preflight?.cuda_check === "not_run"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.ssh_cuda_process_preflight?.process_check === "not_run"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.teardown?.stop_by_name?.exit_code === 0
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.teardown?.stop_by_id?.exit_code === 0
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.teardown?.stop_all?.exit_code === 0
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.teardown?.final_ls?.workspaces
          ?.find((workspace) => workspace.id === "3d58wpy9o")?.status
        === "STOPPED"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.teardown?.final_ls?.workspaces
          ?.find((workspace) => workspace.id === "3d58wpy9o")?.shell_status
        === "NOT READY"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.teardown?.late_read_only_recovery_ls
        ?.worker_stop_not_repeated_because_approved_work_remains_queued === true
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.teardown?.late_read_only_recovery_ls?.workspaces
          ?.find((workspace) => workspace.id === "3d58wpy9o")?.status
        === "RUNNING"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.teardown?.late_read_only_recovery_ls?.workspaces
          ?.find((workspace) => workspace.id === "3d58wpy9o")?.shell_status
        === "READY"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
        ?.teardown?.late_read_only_recovery_ls?.workspaces
          ?.find((workspace) => workspace.id === "3d58wpy9o")?.health_status
        === "HEALTHY"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.remote_work
        ?.remote_exec_reached === false
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.remote_work
        ?.sync_or_hash_verify === "not_run"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.remote_work
        ?.cuda_dryrun === "not_run"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.remote_work
        ?.fulltrain_command === "not_run"
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.remote_work
        ?.optimizer_steps === 0
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.remote_work
        ?.checkpoint_written === false
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.boundaries
        ?.training_run === false
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.boundaries
        ?.optimizer_backward === false
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.boundaries
        ?.infrastructure_create_delete_reset_repair === false
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.boundaries
        ?.retained_worker_left_running_under_approved_queued_work === true
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.decision
        ?.run8_fulltrain_started === false
      && recognizerRun8OvrBceW001PreflightBlockerReceipt.next_action?.token
        === recognizerRun8OvrBceW001FulltrainNextAction,
    {
      path: recognizerRun8OvrBceW001PreflightBlockerReceiptPath,
      ssh_cuda_process_preflight:
        recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
          ?.ssh_cuda_process_preflight ?? null,
      teardown:
        recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
          ?.teardown ?? null,
      remote_work: recognizerRun8OvrBceW001PreflightBlockerReceipt.remote_work ?? null,
      boundaries: recognizerRun8OvrBceW001PreflightBlockerReceipt.boundaries ?? null,
      next_action: recognizerRun8OvrBceW001PreflightBlockerReceipt.next_action ?? null,
    },
    "recognizer run8 OVR-BCE w0.01 Brev preflight blocker must record failed SSH preflight before CUDA/sync/training, no checkpoint/final-gate change, stop attempts, late recovery to running/healthy under approved queued work, and the bounded fulltrain retry next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run8_ovr_bce_w001_fulltrain_records_fail_closed_regression",
    recognizerRun8OvrBceW001FulltrainReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-fulltrain-run8-ovr-bce-w001-brev/v1"
      && recognizerRun8OvrBceW001FulltrainReceipt.status
        === "completed_rejected_fail_closed_below_gate_regressed_vs_running_best"
      && recognizerRun8OvrBceW001FulltrainReceipt.slice
        === recognizerRun8OvrBceW001FulltrainNextAction
      && recognizerRun8OvrBceW001FulltrainReceipt.inputs
        ?.preflight_receipt === recognizerRun8OvrBceW001PreflightReceiptPath
      && recognizerRun8OvrBceW001FulltrainReceipt.inputs
        ?.previous_preflight_blocker_receipt === recognizerRun8OvrBceW001PreflightBlockerReceiptPath
      && recognizerRun8OvrBceW001FulltrainReceipt.approval
        ?.recorded_in_goal_and_active_prompt === true
      && recognizerRun8OvrBceW001FulltrainReceipt.approval
        ?.bounded_to_run8_preflight_receipt_envelope === true
      && recognizerRun8OvrBceW001FulltrainReceipt.worker?.name
        === "asl-pilot-m3eh-l40s-001"
      && recognizerRun8OvrBceW001FulltrainReceipt.remote_preflight
        ?.ssh_probe_passed_attempt === 1
      && recognizerRun8OvrBceW001FulltrainReceipt.remote_preflight
        ?.cuda_available === true
      && recognizerRun8OvrBceW001FulltrainReceipt.sync
        ?.remote_hashes_match_local === true
      && recognizerRun8OvrBceW001FulltrainReceipt.remote_dry_run
        ?.receipt_sha256 === "086211bc501843d9f0520faa3c766acca47de0e1c9c0b7878ce0df8222a6f66f"
      && recognizerRun8OvrBceW001FulltrainReceipt.remote_dry_run
        ?.ovr_bce?.weight === 0.01
      && recognizerRun8OvrBceW001FulltrainReceipt.remote_dry_run
        ?.ovr_bce?.selected_negative_matches_true_label === 0
      && recognizerRun8OvrBceW001FulltrainReceipt.remote_dry_run
        ?.ovr_bce?.uses_test_mined_pairs_for_training === false
      && recognizerRun8OvrBceW001FulltrainReceipt.run
        ?.full_data_no_limit_flags === true
      && recognizerRun8OvrBceW001FulltrainReceipt.run
        ?.optimizer_steps === 13200
      && recognizerRun8OvrBceW001FulltrainReceipt.run
        ?.expected_optimizer_steps === 13200
      && recognizerRun8OvrBceW001FulltrainReceipt.run
        ?.checkpoint_selection?.best_epoch === 83
      && recognizerRun8OvrBceW001FulltrainReceipt.run
        ?.checkpoint_selection?.checkpoint_written === true
      && recognizerRun8OvrBceW001FulltrainReceipt.run
        ?.verification_recall_at_far10 === 0.7571
      && recognizerRun8OvrBceW001FulltrainReceipt.run?.test_top1 === 0.3081
      && recognizerRun8OvrBceW001FulltrainReceipt.run?.test_top5 === 0.6079
      && recognizerRun8OvrBceW001FulltrainReceipt.comparison
        ?.gate_cleared === false
      && recognizerRun8OvrBceW001FulltrainReceipt.comparison
        ?.run8_beats_running_best_primary_recall === false
      && recognizerRun8OvrBceW001FulltrainReceipt.artifacts
        ?.sha256?.json === "8f764717ffa55ed700483dec37ded11c5839b38fa85802d077c0e9a15e63ebeb"
      && recognizerRun8OvrBceW001FulltrainReceipt.artifacts
        ?.sha256?.checkpoint === "0dbc02706dc5615c41edac1d1d128ded50910876b0201f930f59893a5118c5a2"
      && recognizerRun8OvrBceW001FulltrainReceipt.artifacts
        ?.copyback_verified_by_hash === true
      && recognizerRun8OvrBceW001FulltrainReceipt.teardown
        ?.brev_api_auth_available_for_stop === false
      && recognizerRun8OvrBceW001FulltrainReceipt.teardown
        ?.ssh_shutdown?.sent === true
      && recognizerRun8OvrBceW001FulltrainReceipt.teardown
        ?.post_shutdown_ssh_probe?.reachable === false
      && recognizerRun8OvrBceW001FulltrainReceipt.runtime_boundary
        ?.training_run === true
      && recognizerRun8OvrBceW001FulltrainReceipt.runtime_boundary
        ?.checkpoint_written === true
      && recognizerRun8OvrBceW001FulltrainReceipt.runtime_boundary
        ?.browser_artifact_promoted === false
      && recognizerRun8OvrBceW001FulltrainReceipt.runtime_boundary
        ?.final_gate_changed === false
      && recognizerRun8OvrBceW001FulltrainReceipt.next_action?.token
        === recognizerRun8OvrBceW001ResearchTuningNextAction,
    {
      path: recognizerRun8OvrBceW001FulltrainReceiptPath,
      remote_dry_run: recognizerRun8OvrBceW001FulltrainReceipt.remote_dry_run ?? null,
      run: recognizerRun8OvrBceW001FulltrainReceipt.run ?? null,
      comparison: recognizerRun8OvrBceW001FulltrainReceipt.comparison ?? null,
      artifacts: recognizerRun8OvrBceW001FulltrainReceipt.artifacts ?? null,
      teardown: recognizerRun8OvrBceW001FulltrainReceipt.teardown ?? null,
      next_action: recognizerRun8OvrBceW001FulltrainReceipt.next_action ?? null,
    },
    "recognizer run8 OVR-BCE w0.01 fulltrain must record complete 13200-step training, copied hashes, fail-closed regression below gate, SSH-shutdown teardown after Brev auth failure, and no-Brev research next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run8_ovr_bce_w001_research_tuning_selects_three_run_calibration_tail_audit_no_brev",
    recognizerRun8OvrBceW001ResearchTuningReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run8-ovr-bce-w001-research-tuning/v1"
      && recognizerRun8OvrBceW001ResearchTuningReceipt.status
        === "completed_run8_ovr_bce_w001_postmortem_no_brev_no_training"
      && recognizerRun8OvrBceW001ResearchTuningReceipt.slice
        === recognizerRun8OvrBceW001ResearchTuningNextAction
      && recognizerRun8OvrBceW001ResearchTuningReceipt.inputs
        ?.run6_fulltrain_receipt
        === recognizerRun6VerifselectFulltrainReceiptPath
      && recognizerRun8OvrBceW001ResearchTuningReceipt.inputs
        ?.run7_ovr_bce_fulltrain_receipt
        === recognizerRun7OvrBceHardnegFulltrainReceiptPath
      && recognizerRun8OvrBceW001ResearchTuningReceipt.inputs
        ?.run8_fulltrain_receipt
        === recognizerRun8OvrBceW001FulltrainReceiptPath
      && recognizerRun8OvrBceW001ResearchTuningReceipt
        .run6_run7_run8_summary?.run6?.test_verification_recall_at_far10
        === 0.8038559556786704
      && recognizerRun8OvrBceW001ResearchTuningReceipt
        .run6_run7_run8_summary?.run7_ovr_bce_w003
        ?.test_verification_recall_at_far10 === 0.7759113573407201
      && recognizerRun8OvrBceW001ResearchTuningReceipt
        .run6_run7_run8_summary?.run8_ovr_bce_w001
        ?.test_verification_recall_at_far10 === 0.7571
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.status
        === "blocked_no_browser_control_iab_tool_exposed"
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.fallback?.used === true
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.fallback?.route === "openai-api-research"
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.response_id
        === "resp_0585ce963c8da7af006a213dace9d8819491ed3d584b3cb9a7"
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.status === "completed"
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.model_returned === "gpt-5.5-2026-04-23"
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.total_tokens === 5527
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.prompt_md
        === sha256(recognizerRun8OvrBceW001ResearchTuningPromptFilePath)
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.request_json
        === sha256(recognizerRun8OvrBceW001ResearchTuningRequestFilePath)
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.raw_json
        === sha256(recognizerRun8OvrBceW001ResearchTuningRawFilePath)
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.response_md
        === sha256(recognizerRun8OvrBceW001ResearchTuningResponseFilePath)
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_conclusion
        ?.selected_next_action
        === recognizerRun6Run7Run8CalibrationTailAuditNextAction
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_conclusion
        ?.future_paid_recipe?.recommendation === "no_paid_recipe_yet"
      && recognizerRun8OvrBceW001ResearchTuningReceipt.research_conclusion
        ?.brev_auth_prerequisite?.required_before_future_lifecycle_or_compute
        === true
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries?.brev_used
        === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries
        ?.training_run === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries
        ?.runtime_export === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries
        ?.future_paid_recipe_selected === false
      && recognizerRun8OvrBceW001ResearchTuningReceipt.next_action?.token
        === recognizerRun6Run7Run8CalibrationTailAuditNextAction
      && exists(recognizerRun8OvrBceW001ResearchTuningPromptFilePath)
      && exists(recognizerRun8OvrBceW001ResearchTuningRequestFilePath)
      && exists(recognizerRun8OvrBceW001ResearchTuningRawFilePath)
      && exists(recognizerRun8OvrBceW001ResearchTuningResponseFilePath),
    {
      path: recognizerRun8OvrBceW001ResearchTuningReceiptPath,
      run_summary:
        recognizerRun8OvrBceW001ResearchTuningReceipt.run6_run7_run8_summary
          ?? null,
      research_escalation:
        recognizerRun8OvrBceW001ResearchTuningReceipt.research_escalation
          ?? null,
      research_conclusion:
        recognizerRun8OvrBceW001ResearchTuningReceipt.research_conclusion
          ?? null,
      boundaries: recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries ?? null,
      next_action: recognizerRun8OvrBceW001ResearchTuningReceipt.next_action ?? null,
    },
    "recognizer run8 OVR-BCE w0.01 research tuning must record gpt-5.5 fallback artifacts, stop OVR-BCE for now, select a no-Brev run6/run7/run8 calibration-tail audit, require Brev auth recovery before future compute, and avoid selecting another paid recipe",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_run7_run8_calibration_tail_audit_records_monitor_test_mismatch",
    recognizerRun6Run7Run8CalibrationTailAuditReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run6-run7-run8-calibration-tail-audit/v1"
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.status
        === "completed_three_run_calibration_tail_audit_no_brev_no_training"
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.slice
        === recognizerRun6Run7Run8CalibrationTailAuditNextAction
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.inputs
        ?.detailed_audit_sha256
        === sha256(recognizerRun6Run7Run8CalibrationTailDetailedReceiptFilePath)
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.side_worktree
        ?.commit === "ad16b00d"
      && recognizerRun6Run7Run8CalibrationTailDetailedReceipt.schema_version
        === "asl-pilot-m3jb-recognizer-three-run-calibration-tail-audit/v1"
      && recognizerRun6Run7Run8CalibrationTailDetailedReceipt.status
        === "passed_no_training_three_run_calibration_tail_audit"
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.dataset_counts
        ?.clips === 10335
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.dataset_counts
        ?.test_clips === 2369
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.reproduction
        ?.run6_test?.within_tolerance === true
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.reproduction
        ?.run7_test?.within_tolerance === true
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.reproduction
        ?.run8_test?.within_tolerance === true
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.run_summary
        ?.run6?.test_verification_recall_at_far10 === 0.8038559556786704
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.run_summary
        ?.run7_ovr_bce_w003?.test_verification_recall_at_far10
        === 0.7750692520775622
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.run_summary
        ?.run8_ovr_bce_w001?.test_verification_recall_at_far10
        === 0.7571191135734074
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.pairwise_deltas
        ?.run8_minus_run6?.dominant_modes?.includes("broader_positive_margin_damage")
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.pairwise_deltas
        ?.run8_minus_run7?.dominant_modes?.includes("localized_positive_margin_damage")
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt
        .checkpoint_selection_transfer?.best_by_reported_monitor_verification
        === "run7"
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt
        .checkpoint_selection_transfer?.best_by_heldout_test_verification
        === "run6"
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt
        .checkpoint_selection_transfer?.monitor_selection_matches_test_best
        === false
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt
        .checkpoint_selection_transfer
        ?.run8_later_checkpoint_than_run7_with_worse_test_transfer === true
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.decision
        ?.paid_recipe_selected === false
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.decision
        ?.ovr_bce_stopped_for_now === true
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.next_action?.token
        === recognizerPostOvrBceCalibrationSafeResearchNextAction
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.boundaries
        ?.training_run === false
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun6Run7Run8CalibrationTailAuditReceipt.boundaries
        ?.future_paid_recipe_selected === false,
    {
      path: recognizerRun6Run7Run8CalibrationTailAuditReceiptPath,
      detailed_path: recognizerRun6Run7Run8CalibrationTailDetailedReceiptPath,
      run_summary:
        recognizerRun6Run7Run8CalibrationTailAuditReceipt.run_summary ?? null,
      pairwise_deltas:
        recognizerRun6Run7Run8CalibrationTailAuditReceipt.pairwise_deltas
          ?? null,
      checkpoint_selection_transfer:
        recognizerRun6Run7Run8CalibrationTailAuditReceipt
          .checkpoint_selection_transfer ?? null,
      decision:
        recognizerRun6Run7Run8CalibrationTailAuditReceipt.decision ?? null,
      next_action:
        recognizerRun6Run7Run8CalibrationTailAuditReceipt.next_action ?? null,
    },
    "recognizer run6/run7/run8 calibration-tail audit must reproduce metrics, classify run8 regression, keep run6 as test best despite run7 monitor best, select no paid recipe, and preserve no-Brev/no-training boundaries",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_post_ovr_bce_calibration_safe_research_selects_run6_monitor_selection_stability_preflight_no_brev",
    recognizerPostOvrBceCalibrationSafeResearchReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-post-ovr-bce-calibration-safe-research/v1"
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.status
        === "completed_post_ovr_bce_calibration_safe_research_no_brev_no_training"
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.slice
        === recognizerPostOvrBceCalibrationSafeResearchNextAction
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.inputs
        ?.three_run_calibration_tail_audit_summary
        === recognizerRun6Run7Run8CalibrationTailAuditReceiptPath
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.inputs
        ?.three_run_calibration_tail_audit_detailed
        === recognizerRun6Run7Run8CalibrationTailDetailedReceiptPath
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.inputs
        ?.three_run_calibration_tail_audit_detailed_sha256
        === sha256(recognizerRun6Run7Run8CalibrationTailDetailedReceiptFilePath)
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.gpt_pro_web_attempt?.status
        === "blocked_no_browser_control_iab_tool_exposed"
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.fallback?.used === true
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.fallback?.route === "openai-api-research"
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.fallback?.calls?.[0]?.response_id
        === "resp_0701b4689f25eb29006a214576dcac8197b1f838ad45dbf2b5"
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.fallback?.calls?.[0]?.status === "completed"
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.fallback?.calls?.[0]?.model_returned
        === "gpt-5.5-2026-04-23"
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.fallback?.calls?.[0]?.total_tokens === 5912
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.fallback?.artifacts_sha256?.prompt_md
        === sha256(recognizerPostOvrBceCalibrationSafeResearchPromptFilePath)
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.fallback?.artifacts_sha256?.request_json
        === sha256(recognizerPostOvrBceCalibrationSafeResearchRequestFilePath)
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.fallback?.artifacts_sha256?.raw_json
        === sha256(recognizerPostOvrBceCalibrationSafeResearchRawFilePath)
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_escalation?.fallback?.artifacts_sha256?.response_md
        === sha256(recognizerPostOvrBceCalibrationSafeResearchResponseFilePath)
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_conclusion?.selected_next_action
        === recognizerRun6MonitorSelectionStabilityPreflightNextAction
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_conclusion?.future_paid_recipe?.recommendation
        === "no_paid_recipe_yet"
      && recognizerPostOvrBceCalibrationSafeResearchReceipt
        .research_conclusion?.brev_auth_prerequisite
        ?.required_before_future_lifecycle_or_compute === true
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.brev_used === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.training_run === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.runtime_export === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.browser_promotion === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries
        ?.future_paid_recipe_selected === false
      && recognizerPostOvrBceCalibrationSafeResearchReceipt.next_action?.token
        === recognizerRun6MonitorSelectionStabilityPreflightNextAction
      && exists(recognizerPostOvrBceCalibrationSafeResearchPromptFilePath)
      && exists(recognizerPostOvrBceCalibrationSafeResearchRequestFilePath)
      && exists(recognizerPostOvrBceCalibrationSafeResearchRawFilePath)
      && exists(recognizerPostOvrBceCalibrationSafeResearchResponseFilePath),
    {
      path: recognizerPostOvrBceCalibrationSafeResearchReceiptPath,
      research_escalation:
        recognizerPostOvrBceCalibrationSafeResearchReceipt.research_escalation
          ?? null,
      research_conclusion:
        recognizerPostOvrBceCalibrationSafeResearchReceipt.research_conclusion
          ?? null,
      boundaries:
        recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries ?? null,
      next_action:
        recognizerPostOvrBceCalibrationSafeResearchReceipt.next_action ?? null,
    },
    "recognizer post-OVR-BCE calibration-safe research must record gpt-5.5 fallback artifacts, select the run6 monitor-selection stability preflight, keep no paid recipe selected, require Brev auth before future compute, and preserve no-Brev/no-training boundaries",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run6_monitor_selection_stability_preflight_records_artifact_insufficiency",
    recognizerRun6MonitorSelectionStabilityPreflightReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run6-monitor-selection-stability-preflight/v1"
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.status
        === "completed_fail_closed_artifact_insufficient_for_selector_test_transfer"
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.slice
        === recognizerRun6MonitorSelectionStabilityPreflightNextAction
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.detailed_receipt
        ?.path === recognizerRun6MonitorSelectionStabilityDetailedReceiptPath
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.detailed_receipt
        ?.sha256 === sha256(recognizerRun6MonitorSelectionStabilityDetailedReceiptFilePath)
      && recognizerRun6MonitorSelectionStabilityDetailedReceipt.schema_version
        === "asl-pilot-m3jb-recognizer-run6-monitor-selection-stability-preflight/v1"
      && recognizerRun6MonitorSelectionStabilityDetailedReceipt.status
        === "completed_fail_closed_artifact_insufficient_for_selector_test_transfer"
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.run6_result
        ?.reported_test_verification_recall_at_far10 === 0.8039
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.run6_result
        ?.best_monitor_epoch === 14
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.run6_result
        ?.best_monitor_verification_recall_far10 === 0.8169
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.run6_result
        ?.alternate_epoch_checkpoint_count === 0
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.run6_result
        ?.per_epoch_logits_count === 0
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt
        .selector_transfer_preflight?.current_checkpoint_selection_reconstructed
        === true
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt
        .selector_transfer_preflight?.unique_candidate_epochs?.includes(14)
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt
        .selector_transfer_preflight?.unique_candidate_epochs?.includes(31)
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt
        .selector_transfer_preflight?.all_candidates_test_evaluable === false
      && recognizerRun6MonitorSelectionStabilityDetailedReceipt.runs?.run6
        ?.selector_test_transfer?.all_candidates_test_evaluable === false
      && recognizerRun6MonitorSelectionStabilityDetailedReceipt.runs?.run6
        ?.artifact_inventory?.alternate_epoch_checkpoint_count === 0
      && recognizerRun6MonitorSelectionStabilityDetailedReceipt.runs?.run6
        ?.artifact_inventory?.per_epoch_logits_count === 0
      && recognizerRun6MonitorSelectionStabilityDetailedReceipt.runs?.run6
        ?.selector_test_transfer?.alternate_selector_epochs?.includes(31)
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.decision
        ?.paid_recipe_selected === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.decision
        ?.future_paid_recipe_ready === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.decision
        ?.next_action?.token
        === recognizerCandidateCheckpointRetentionPreflightNextAction
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
        ?.brev_used === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
        ?.training_run === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
        ?.runtime_export === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
        ?.final_gate_changed === false,
    {
      summary_path: recognizerRun6MonitorSelectionStabilityPreflightReceiptPath,
      detailed_path: recognizerRun6MonitorSelectionStabilityDetailedReceiptPath,
      status:
        recognizerRun6MonitorSelectionStabilityPreflightReceipt.status ?? null,
      run6_result:
        recognizerRun6MonitorSelectionStabilityPreflightReceipt.run6_result
          ?? null,
      selector_transfer_preflight:
        recognizerRun6MonitorSelectionStabilityPreflightReceipt
          .selector_transfer_preflight ?? null,
      decision:
        recognizerRun6MonitorSelectionStabilityPreflightReceipt.decision
          ?? null,
      boundaries:
        recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
          ?? null,
    },
    "recognizer run6 monitor-selection stability preflight must reconstruct epoch 14, identify unevaluable epoch 31 candidate selection, select no paid recipe, and preserve no-Brev/no-training boundaries",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_candidate_checkpoint_retention_preflight_records_no_write_dryrun",
    recognizerCandidateCheckpointRetentionPreflightReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-candidate-checkpoint-retention-preflight/v1"
      && recognizerCandidateCheckpointRetentionPreflightReceipt.status
        === "passed_no_brev_candidate_checkpoint_retention_preflight"
      && recognizerCandidateCheckpointRetentionPreflightReceipt.slice
        === recognizerCandidateCheckpointRetentionPreflightNextAction
      && recognizerCandidateCheckpointRetentionPreflightReceipt.dryrun_receipt
        ?.path === recognizerCandidateCheckpointRetentionDryrunReceiptPath
      && recognizerCandidateCheckpointRetentionPreflightReceipt.dryrun_receipt
        ?.sha256 === sha256(recognizerCandidateCheckpointRetentionDryrunReceiptFilePath)
      && recognizerCandidateCheckpointRetentionDryrunReceipt.schema_version
        === "asl-pilot-recognizer-distill/v1"
      && recognizerCandidateCheckpointRetentionDryrunReceipt.training_mode
        === "dry_run_forward"
      && recognizerCandidateCheckpointRetentionDryrunReceipt.train_clips === 7011
      && recognizerCandidateCheckpointRetentionDryrunReceipt.monitor_clips === 955
      && recognizerCandidateCheckpointRetentionDryrunReceipt.test_clips === 2369
      && recognizerCandidateCheckpointRetentionDryrunReceipt.optimizer_steps === 0
      && recognizerCandidateCheckpointRetentionDryrunReceipt.expected_optimizer_steps === 0
      && recognizerCandidateCheckpointRetentionDryrunReceipt.planned_optimizer_steps === 13200
      && recognizerCandidateCheckpointRetentionDryrunReceipt.weights === null
      && recognizerCandidateCheckpointRetentionDryrunReceipt.checkpoint_selection
        ?.checkpoint_written === false
      && recognizerCandidateCheckpointRetentionDryrunReceipt
        .candidate_checkpoint_retention?.enabled === true
      && recognizerCandidateCheckpointRetentionDryrunReceipt
        .candidate_checkpoint_retention?.retain_checkpoints === true
      && recognizerCandidateCheckpointRetentionDryrunReceipt
        .candidate_checkpoint_retention?.retain_logits === false
      && recognizerCandidateCheckpointRetentionDryrunReceipt
        .candidate_checkpoint_retention?.checkpoint_writes_allowed === false
      && recognizerCandidateCheckpointRetentionDryrunReceipt
        .candidate_checkpoint_retention?.checkpoint_write_blocker
        === "dry_run_forward"
      && recognizerCandidateCheckpointRetentionDryrunReceipt
        .candidate_checkpoint_retention?.retained_checkpoint_count === 0
      && recognizerCandidateCheckpointRetentionDryrunReceipt
        .candidate_checkpoint_retention?.uses_test_mined_pairs_for_training
        === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.dryrun_result
        ?.candidate_checkpoint_retention?.checkpoint_write_blocker
        === "dry_run_forward"
      && recognizerCandidateCheckpointRetentionPreflightReceipt.dryrun_result
        ?.candidate_checkpoint_retention?.retained_checkpoint_count === 0
      && recognizerCandidateCheckpointRetentionPreflightReceipt.decision
        ?.paid_recipe_selected === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.decision
        ?.future_paid_recipe_ready === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.decision
        ?.next_action?.token
        === recognizerRetentionEnabledResearchTuningNextAction
      && recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
        ?.brev_used === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
        ?.training_run === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
        ?.runtime_export === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
        ?.browser_promotion === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
        ?.final_gate_changed === false,
    {
      summary_path: recognizerCandidateCheckpointRetentionPreflightReceiptPath,
      dryrun_path: recognizerCandidateCheckpointRetentionDryrunReceiptPath,
      status:
        recognizerCandidateCheckpointRetentionPreflightReceipt.status ?? null,
      dryrun_result:
        recognizerCandidateCheckpointRetentionPreflightReceipt.dryrun_result
          ?? null,
      candidate_checkpoint_retention:
        recognizerCandidateCheckpointRetentionDryrunReceipt
          .candidate_checkpoint_retention ?? null,
      decision:
        recognizerCandidateCheckpointRetentionPreflightReceipt.decision ?? null,
      boundaries:
        recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
          ?? null,
    },
    "recognizer candidate checkpoint retention preflight must enable retention in a full-cache dry-run, write no checkpoint, select no paid recipe, and preserve no-Brev/no-training boundaries",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_retention_enabled_research_tuning_selects_run9_recipe_preflight_no_brev",
    recognizerRetentionEnabledResearchTuningReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-retention-enabled-research-tuning/v1"
      && recognizerRetentionEnabledResearchTuningReceipt.status
        === "completed_retention_enabled_research_tuning_no_brev_no_training"
      && recognizerRetentionEnabledResearchTuningReceipt.slice
        === recognizerRetentionEnabledResearchTuningNextAction
      && recognizerRetentionEnabledResearchTuningReceipt.inputs
        ?.candidate_checkpoint_retention_preflight
        === recognizerCandidateCheckpointRetentionPreflightReceiptPath
      && recognizerRetentionEnabledResearchTuningReceipt.inputs
        ?.candidate_checkpoint_retention_dryrun
        === recognizerCandidateCheckpointRetentionDryrunReceiptPath
      && recognizerRetentionEnabledResearchTuningReceipt.inputs
        ?.candidate_checkpoint_retention_dryrun_sha256
        === sha256(recognizerCandidateCheckpointRetentionDryrunReceiptFilePath)
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.gpt_pro_web_attempt?.status
        === "blocked_no_browser_control_iab_tool_exposed"
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.fallback?.used === true
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.fallback?.route === "openai-api-research"
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.response_id
        === "resp_0c05446d4cf7fa7b006a214fd83d4881969db35a0dcba78d49"
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.status === "completed"
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.model_returned === "gpt-5.5-2026-04-23"
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.fallback?.calls?.[0]?.total_tokens === 4651
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.prompt_md
        === sha256(recognizerRetentionEnabledResearchTuningPromptFilePath)
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.request_json
        === sha256(recognizerRetentionEnabledResearchTuningRequestFilePath)
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.raw_json
        === sha256(recognizerRetentionEnabledResearchTuningRawFilePath)
      && recognizerRetentionEnabledResearchTuningReceipt.research_escalation
        ?.fallback?.artifacts_sha256?.response_md
        === sha256(recognizerRetentionEnabledResearchTuningResponseFilePath)
      && recognizerRetentionEnabledResearchTuningReceipt.research_conclusion
        ?.selected_next_action
        === recognizerRun9RetentionEnabledRun6RecipePreflightNextAction
      && recognizerRetentionEnabledResearchTuningReceipt.research_conclusion
        ?.research_model_recommended_token
        === "record_run9_retention_enabled_run6_recipe"
      && recognizerRetentionEnabledResearchTuningReceipt.research_conclusion
        ?.selected_no_brev_preflight?.expected_counts?.planned_optimizer_steps
        === 13200
      && recognizerRetentionEnabledResearchTuningReceipt.research_conclusion
        ?.selected_no_brev_preflight?.required_recipe_terms
        ?.includes("--retain-candidate-checkpoints")
      && recognizerRetentionEnabledResearchTuningReceipt.research_conclusion
        ?.future_paid_recipe?.selected_now === false
      && recognizerRetentionEnabledResearchTuningReceipt.research_conclusion
        ?.future_paid_recipe?.not_authorized_in_this_slice === true
      && recognizerRetentionEnabledResearchTuningReceipt.research_conclusion
        ?.brev_auth_prerequisite?.required_before_future_lifecycle_or_compute
        === true
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.brev_used === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.brev_lifecycle_or_exec === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.training_run === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.optimizer_or_backward_step === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.checkpoint_written === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.runtime_export === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.browser_promotion === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.raw_learner_video_upload === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.pretrained_runtime_dependency_added === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.final_gate_changed === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.raw_test_mined_supervision === false
      && recognizerRetentionEnabledResearchTuningReceipt.boundaries
        ?.future_paid_recipe_selected === false
      && recognizerRetentionEnabledResearchTuningReceipt.next_action?.token
        === recognizerRun9RetentionEnabledRun6RecipePreflightNextAction
      && exists(recognizerRetentionEnabledResearchTuningPromptFilePath)
      && exists(recognizerRetentionEnabledResearchTuningRequestFilePath)
      && exists(recognizerRetentionEnabledResearchTuningRawFilePath)
      && exists(recognizerRetentionEnabledResearchTuningResponseFilePath),
    {
      path: recognizerRetentionEnabledResearchTuningReceiptPath,
      research_escalation:
        recognizerRetentionEnabledResearchTuningReceipt.research_escalation
          ?? null,
      research_conclusion:
        recognizerRetentionEnabledResearchTuningReceipt.research_conclusion
          ?? null,
      boundaries:
        recognizerRetentionEnabledResearchTuningReceipt.boundaries ?? null,
      next_action:
        recognizerRetentionEnabledResearchTuningReceipt.next_action ?? null,
    },
    "recognizer retention-enabled research tuning must record gpt-5.5 fallback artifacts, select the run9 retention-enabled run6 recipe preflight, keep paid compute unselected, require Brev auth before future compute, and preserve no-Brev/no-training boundaries",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run9_retention_enabled_run6_recipe_preflight_records_blocked_future_envelope",
    recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run9-retention-enabled-run6-recipe-preflight/v1"
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.status
        === "passed_no_brev_run9_retention_enabled_run6_recipe_preflight"
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.slice
        === recognizerRun9RetentionEnabledRun6RecipePreflightNextAction
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.source_of_truth
        ?.previous_research_receipt
        === recognizerRetentionEnabledResearchTuningReceiptPath
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.dryrun_receipt
        ?.path === recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.dryrun_receipt
        ?.sha256
        === sha256(recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptFilePath)
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .schema_version === "asl-pilot-recognizer-distill/v1"
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .training_mode === "dry_run_forward"
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .student_arch === "transformer"
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .student_cache?.clips === 10335
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .student_cache?.classes === 95
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .student_cache?.sequence_length === 32
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .student_cache?.feature_dim === 90
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .train_clips === 7011
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .monitor_clips === 955
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .test_clips === 2369
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .optimizer_steps === 0
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .expected_optimizer_steps === 0
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .planned_optimizer_steps === 13200
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .weights === null
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .supcon?.enabled === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .ovr_bce?.enabled === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .ovr_bce?.uses_test_mined_pairs_for_training === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .dry_run_forward?.logits_shape?.[0] === 128
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .dry_run_forward?.logits_shape?.[1] === 95
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .dry_run_forward?.optimizer_steps === 0
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .dry_run_forward?.backward_called === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .checkpoint_selection?.metric_name
        === "monitor_verification_recall_far10"
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .checkpoint_selection?.checkpoint_written === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .checkpoint_selection?.eval_verification_every === 1
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .candidate_checkpoint_retention?.enabled === true
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .candidate_checkpoint_retention?.retain_checkpoints === true
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .candidate_checkpoint_retention?.epsilon === 0.005
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .candidate_checkpoint_retention?.window === 5
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .candidate_checkpoint_retention?.checkpoint_writes_allowed === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .candidate_checkpoint_retention?.checkpoint_write_blocker
        === "dry_run_forward"
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .candidate_checkpoint_retention?.retained_checkpoint_count === 0
      && recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceipt
        .candidate_checkpoint_retention?.uses_test_mined_pairs_for_training
        === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .future_run9_envelope?.launchable_now === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .future_run9_envelope
        ?.blocked_until_brev_auth_and_inventory_visible === true
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .future_run9_envelope?.future_fulltrain_token_after_auth
        === recognizerRun9RetentionEnabledRun6FulltrainAfterAuthNextAction
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .future_run9_envelope?.full_data_no_limit_flags === true
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .future_run9_envelope?.planned_optimizer_steps === 13200
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .future_run9_envelope?.supcon?.enabled === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .future_run9_envelope?.ovr_bce?.enabled === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .future_run9_envelope?.checkpoint_selection?.metric_name
        === "monitor_verification_recall_far10"
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .future_run9_envelope?.candidate_checkpoint_retention?.enabled
        === true
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .decision?.run9_recipe_preflight_completed === true
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .decision?.future_compute_envelope_recorded === true
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .decision?.future_kill_criteria_recorded === true
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .decision?.paid_recipe_selected === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .decision?.future_compute_blocked_until_brev_auth === true
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .decision?.next_action?.token
        === recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.brev_used === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.brev_lifecycle_or_exec === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.training_run === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.optimizer_or_backward_step === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.checkpoint_written === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.runtime_export === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.browser_promotion === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.raw_learner_video_upload === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.pretrained_runtime_dependency_added === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.final_gate_changed === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.raw_test_mined_supervision === false
      && recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
        .boundaries?.future_paid_recipe_selected === false,
    {
      summary_path: recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath,
      dryrun_path: recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath,
      status:
        recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.status
          ?? null,
      dryrun_result:
        recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
          .dryrun_result ?? null,
      future_run9_envelope:
        recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
          .future_run9_envelope ?? null,
      decision:
        recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.decision
          ?? null,
      boundaries:
        recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.boundaries
          ?? null,
    },
    "recognizer run9 retention-enabled run6 recipe preflight must record a full-count no-save dry-run, keep OVR-BCE/SupCon disabled, enable candidate checkpoint retention, write no checkpoint, record future run envelope/kill criteria, and keep future compute blocked until Brev auth visibility succeeds",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run9_brev_auth_visibility_refresh_records_logged_out_blocker",
    recognizerRun9BrevAuthVisibilityRefreshReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run9-brev-auth-visibility-refresh/v1"
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.status
        === "blocked_brev_auth_visibility_not_recovered_no_spend"
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.slice
        === recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.source_of_truth
        ?.previous_recipe_preflight_receipt
        === recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.source_of_truth
        ?.previous_recipe_dryrun_receipt
        === recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.source_of_truth
        ?.active_next_action_before_slice
        === recognizerRun9RetentionEnabledBrevAuthVisibilityNextAction
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.command?.command
        === "brev ls --json"
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.command?.exit_code
        === 1
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.command?.stdout
        ?.includes("You are currently logged out")
      && Array.isArray(
        recognizerRun9BrevAuthVisibilityRefreshReceipt.command
          ?.stderr_excerpt,
      )
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.command.stderr_excerpt
        .some((line) => line.includes("PromptForLogin"))
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.command.stderr_excerpt
        .some((line) => line.includes("EOF"))
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.visibility_result
        ?.brev_cli_auth_recovered === false
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.visibility_result
        ?.brev_ls_json_succeeded === false
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.visibility_result
        ?.inventory_available === false
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.visibility_result
        ?.worker_state_verified === false
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.visibility_result
        ?.retained_worker_name === "asl-pilot-m3eh-l40s-001"
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.visibility_result
        ?.retained_worker_id === "3d58wpy9o"
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.visibility_result
        ?.retained_worker_state === "unknown_auth_blocked"
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.visibility_result
        ?.future_compute_launchable === false
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.decision
        ?.auth_visibility_refresh_completed === true
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.decision
        ?.auth_visibility_recovered === false
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.decision
        ?.worker_inventory_verified === false
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.decision
        ?.paid_compute_selected === false
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.decision
        ?.future_run9_fulltrain_launchable === false
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.decision
        ?.human_action_required === true
      && recognizerRun9BrevAuthVisibilityRefreshReceipt.decision?.next_action
        ?.token === recognizerRun9RetentionEnabledAwaitBrevLoginNextAction
      && [
        "brev_spend",
        "brev_lifecycle_start_stop",
        "brev_exec_or_sync",
        "remote_mutation",
        "training_run",
        "optimizer_or_backward_step",
        "checkpoint_written",
        "runtime_export",
        "browser_promotion",
        "raw_learner_video_upload",
        "pretrained_runtime_dependency_added",
        "raw_test_mined_supervision",
        "final_gate_changed",
        "infrastructure_create_delete_reset_repair",
        "push",
      ].every(
        (field) =>
          recognizerRun9BrevAuthVisibilityRefreshReceipt.boundaries?.[field]
            === false,
      ),
    {
      path: recognizerRun9BrevAuthVisibilityRefreshReceiptPath,
      status: recognizerRun9BrevAuthVisibilityRefreshReceipt.status ?? null,
      command: recognizerRun9BrevAuthVisibilityRefreshReceipt.command ?? null,
      visibility_result:
        recognizerRun9BrevAuthVisibilityRefreshReceipt.visibility_result
          ?? null,
      decision:
        recognizerRun9BrevAuthVisibilityRefreshReceipt.decision ?? null,
      boundaries:
        recognizerRun9BrevAuthVisibilityRefreshReceipt.boundaries ?? null,
    },
    "recognizer run9 Brev auth visibility refresh must record the no-spend logged-out/EOF blocker, leave worker state unknown, keep all lifecycle/training/export/gate boundaries false, and route next to human Brev login",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run9_brev_auth_visibility_retry_records_still_logged_out_blocker",
    recognizerRun9BrevAuthVisibilityRetryReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run9-brev-auth-visibility-retry/v1"
      && recognizerRun9BrevAuthVisibilityRetryReceipt.status
        === "blocked_brev_auth_still_logged_out_no_spend"
      && recognizerRun9BrevAuthVisibilityRetryReceipt.slice
        === recognizerRun9RetentionEnabledAwaitBrevLoginNextAction
      && recognizerRun9BrevAuthVisibilityRetryReceipt.source_of_truth
        ?.previous_visibility_receipt
        === recognizerRun9BrevAuthVisibilityRefreshReceiptPath
      && recognizerRun9BrevAuthVisibilityRetryReceipt.source_of_truth
        ?.previous_recipe_preflight_receipt
        === recognizerRun9RetentionEnabledRun6RecipePreflightReceiptPath
      && recognizerRun9BrevAuthVisibilityRetryReceipt.source_of_truth
        ?.previous_recipe_dryrun_receipt
        === recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptPath
      && recognizerRun9BrevAuthVisibilityRetryReceipt.source_of_truth
        ?.active_next_action_before_slice
        === recognizerRun9RetentionEnabledAwaitBrevLoginNextAction
      && recognizerRun9BrevAuthVisibilityRetryReceipt.command?.command
        === "brev ls --json"
      && recognizerRun9BrevAuthVisibilityRetryReceipt.command?.exit_code === 1
      && recognizerRun9BrevAuthVisibilityRetryReceipt.command?.stdout
        ?.includes("You are currently logged out")
      && Array.isArray(
        recognizerRun9BrevAuthVisibilityRetryReceipt.command?.stderr_excerpt,
      )
      && recognizerRun9BrevAuthVisibilityRetryReceipt.command.stderr_excerpt
        .some((line) => line.includes("PromptForLogin"))
      && recognizerRun9BrevAuthVisibilityRetryReceipt.command.stderr_excerpt
        .some((line) => line.includes("EOF"))
      && recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result
        ?.auth_restored_since_session_955 === false
      && recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result
        ?.brev_cli_auth_recovered === false
      && recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result
        ?.brev_ls_json_succeeded === false
      && recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result
        ?.inventory_available === false
      && recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result
        ?.worker_state_verified === false
      && recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result
        ?.retained_worker_name === "asl-pilot-m3eh-l40s-001"
      && recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result
        ?.retained_worker_id === "3d58wpy9o"
      && recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result
        ?.retained_worker_state === "unknown_auth_blocked"
      && recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result
        ?.future_compute_launchable === false
      && recognizerRun9BrevAuthVisibilityRetryReceipt.decision
        ?.auth_visibility_retry_completed === true
      && recognizerRun9BrevAuthVisibilityRetryReceipt.decision
        ?.auth_visibility_recovered === false
      && recognizerRun9BrevAuthVisibilityRetryReceipt.decision
        ?.worker_inventory_verified === false
      && recognizerRun9BrevAuthVisibilityRetryReceipt.decision
        ?.paid_compute_selected === false
      && recognizerRun9BrevAuthVisibilityRetryReceipt.decision
        ?.future_run9_fulltrain_launchable === false
      && recognizerRun9BrevAuthVisibilityRetryReceipt.decision
        ?.human_action_required === true
      && recognizerRun9BrevAuthVisibilityRetryReceipt.decision?.next_action
        ?.token === recognizerRun9RetentionEnabledAwaitBrevLoginNextAction
      && [
        "brev_spend",
        "brev_lifecycle_start_stop",
        "brev_exec_or_sync",
        "remote_mutation",
        "training_run",
        "optimizer_or_backward_step",
        "checkpoint_written",
        "runtime_export",
        "browser_promotion",
        "raw_learner_video_upload",
        "pretrained_runtime_dependency_added",
        "raw_test_mined_supervision",
        "final_gate_changed",
        "infrastructure_create_delete_reset_repair",
        "push",
      ].every(
        (field) =>
          recognizerRun9BrevAuthVisibilityRetryReceipt.boundaries?.[field]
            === false,
      ),
    {
      path: recognizerRun9BrevAuthVisibilityRetryReceiptPath,
      status: recognizerRun9BrevAuthVisibilityRetryReceipt.status ?? null,
      command: recognizerRun9BrevAuthVisibilityRetryReceipt.command ?? null,
      visibility_result:
        recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result ?? null,
      decision: recognizerRun9BrevAuthVisibilityRetryReceipt.decision ?? null,
      boundaries:
        recognizerRun9BrevAuthVisibilityRetryReceipt.boundaries ?? null,
    },
    "recognizer run9 Brev auth visibility retry must record that auth is still logged out, keep worker state unknown, keep all lifecycle/training/export/gate boundaries false, and preserve the human Brev login next action",
  );
  addCheck(
    checks,
    blockers,
    "recognizer_run9_brev_auth_human_login_boundary_records_no_more_auto_retries",
    recognizerRun9BrevAuthHumanLoginBoundaryReceipt.schema_version
      === "asl-pilot-m3jb-recognizer-transformer-run9-brev-auth-human-login-boundary/v1"
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.status
        === "blocked_await_human_brev_login_confirmation_no_more_auto_retries"
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.slice
        === recognizerRun9RetentionEnabledAwaitBrevLoginNextAction
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.source_of_truth
        ?.session_955_visibility_receipt
        === recognizerRun9BrevAuthVisibilityRefreshReceiptPath
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.source_of_truth
        ?.session_956_visibility_retry_receipt
        === recognizerRun9BrevAuthVisibilityRetryReceiptPath
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.source_of_truth
        ?.session_957_visibility_retry_receipt
        === "docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-visibility-retry-957-v1.json"
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.source_of_truth
        ?.active_next_action_before_slice
        === recognizerRun9RetentionEnabledAwaitBrevLoginNextAction
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.latest_probe?.command
        === "brev ls --json"
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.latest_probe
        ?.exit_code === 1
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.latest_probe?.stdout
        ?.includes("You are currently logged out")
      && Array.isArray(
        recognizerRun9BrevAuthHumanLoginBoundaryReceipt.latest_probe
          ?.stderr_excerpt,
      )
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.latest_probe
        .stderr_excerpt.some((line) => line.includes("PromptForLogin"))
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.latest_probe
        .stderr_excerpt.some((line) => line.includes("EOF"))
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
        ?.auth_restored_since_session_957 === false
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
        ?.brev_cli_auth_recovered === false
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
        ?.brev_ls_json_succeeded === false
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
        ?.inventory_available === false
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
        ?.worker_state_verified === false
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
        ?.retained_worker_name === "asl-pilot-m3eh-l40s-001"
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
        ?.retained_worker_id === "3d58wpy9o"
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
        ?.retained_worker_state === "unknown_auth_blocked"
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
        ?.future_compute_launchable === false
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.decision
        ?.auth_visibility_boundary_recorded === true
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.decision
        ?.repeated_no_spend_visibility_retry_count === 4
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.decision
        ?.no_more_auto_brev_cli_retries_until_human_confirms_login === true
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.decision
        ?.human_action_required === true
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.decision?.next_action
        ?.token === recognizerRun9RetentionEnabledWaitForHumanBrevLoginNextAction
      && recognizerRun9BrevAuthHumanLoginBoundaryReceipt.decision?.next_action
        ?.follow_up_after_human_login_confirmation
        === recognizerRun9RetentionEnabledAwaitBrevLoginNextAction
      && [
        "brev_spend",
        "brev_lifecycle_start_stop",
        "brev_exec_or_sync",
        "remote_mutation",
        "training_run",
        "optimizer_or_backward_step",
        "checkpoint_written",
        "runtime_export",
        "browser_promotion",
        "raw_learner_video_upload",
        "pretrained_runtime_dependency_added",
        "raw_test_mined_supervision",
        "final_gate_changed",
        "infrastructure_create_delete_reset_repair",
        "push",
      ].every(
        (field) =>
          recognizerRun9BrevAuthHumanLoginBoundaryReceipt.boundaries?.[field]
            === false,
      ),
    {
      path: recognizerRun9BrevAuthHumanLoginBoundaryReceiptPath,
      status:
        recognizerRun9BrevAuthHumanLoginBoundaryReceipt.status ?? null,
      latest_probe:
        recognizerRun9BrevAuthHumanLoginBoundaryReceipt.latest_probe ?? null,
      visibility_result:
        recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
          ?? null,
      decision:
        recognizerRun9BrevAuthHumanLoginBoundaryReceipt.decision ?? null,
      boundaries:
        recognizerRun9BrevAuthHumanLoginBoundaryReceipt.boundaries ?? null,
    },
    "recognizer run9 Brev auth human-login boundary must record repeated logged-out/EOF probes, stop further automated Brev CLI retries until explicit human confirmation, and preserve all no-spend/no-lifecycle/no-training boundaries",
  );
  addCheck(
    checks,
    blockers,
    "landmark_retrain_local_preflight_matches_plan_without_launch",
    landmarkRetrainLocalPreflightReceipt.schema_version
      === "asl-pilot-m3jb-landmark-retrain-local-preflight/v1"
      && landmarkRetrainLocalPreflightReceipt.status
        === "passed_local_preflight_actual_launch_blocked_pending_brev_approval"
      && landmarkRetrainLocalPreflightReceipt.approval_state
        ?.current_thread_explicit_brev_spend_approval === false
      && landmarkRetrainLocalPreflightReceipt.approval_state
        ?.effective_launch_allowed_now === false
      && landmarkRetrainLocalPreflightReceipt.local_preflight?.status === "passed"
      && landmarkRetrainLocalPreflightReceipt.local_preflight?.trainer
        ?.syntax_parse === "passed"
      && landmarkRetrainLocalPreflightReceipt.local_preflight?.trainer?.sha256
        === landmarkRetrainBrevPlanReceipt.source_inputs?.trainer_sha256
      && Array.isArray(
        landmarkRetrainLocalPreflightReceipt.local_preflight?.trainer
          ?.missing_required_flags,
      )
      && landmarkRetrainLocalPreflightReceipt.local_preflight.trainer
        .missing_required_flags.length === 0
      && landmarkRetrainLocalPreflightReceipt.local_preflight?.cache?.rows_json
        ?.sha256
        === landmarkRetrainBrevPlanReceipt.source_inputs?.cache_artifacts
          ?.rows_json?.sha256
      && landmarkRetrainLocalPreflightReceipt.local_preflight?.cache?.splits_json
        ?.sha256
        === landmarkRetrainBrevPlanReceipt.source_inputs?.cache_artifacts
          ?.splits_json?.sha256
      && landmarkRetrainLocalPreflightReceipt.local_preflight?.cache?.rows_json
        ?.stats?.hands_kept === 30120
      && landmarkRetrainLocalPreflightReceipt.local_preflight?.cache
        ?.splits_json?.rows === 30120
      && landmarkRetrainLocalPreflightReceipt.local_preflight?.cache?.arrays
        ?.shape_match_rows === true
      && landmarkRetrainLocalPreflightReceipt.local_preflight?.cache?.arrays
        ?.frames?.shape?.[0] === 30120
      && landmarkRetrainLocalPreflightReceipt.local_preflight?.cache?.arrays
        ?.kpts?.shape?.[0] === 30120
      && Array.isArray(
        landmarkRetrainLocalPreflightReceipt.local_preflight?.planned_outputs,
      )
      && landmarkRetrainLocalPreflightReceipt.local_preflight.planned_outputs
        .length === 4
      && landmarkRetrainLocalPreflightReceipt.local_preflight.planned_outputs
        .every((artifact) => artifact.exists === false)
      && landmarkRetrainLocalPreflightReceipt.runtime_boundary
        ?.local_only_this_slice === true
      && landmarkRetrainLocalPreflightReceipt.runtime_boundary
        ?.brev_exec_or_copy === false
      && landmarkRetrainLocalPreflightReceipt.runtime_boundary
        ?.remote_mutation === false
      && landmarkRetrainLocalPreflightReceipt.runtime_boundary
        ?.training_run === false
      && landmarkRetrainLocalPreflightReceipt.runtime_boundary
        ?.checkpoint_written === false
      && landmarkRetrainLocalPreflightReceipt.next_action
        === "await_explicit_brev_spend_approval_then_launch_landmark_retrain_brev_plan",
    {
      path: landmarkRetrainLocalPreflightReceiptPath,
      status: landmarkRetrainLocalPreflightReceipt.status ?? null,
      trainer_sha256:
        landmarkRetrainLocalPreflightReceipt.local_preflight?.trainer?.sha256 ?? null,
      expected_trainer_sha256:
        landmarkRetrainBrevPlanReceipt.source_inputs?.trainer_sha256 ?? null,
      missing_required_flags:
        landmarkRetrainLocalPreflightReceipt.local_preflight?.trainer
          ?.missing_required_flags ?? null,
      rows_sha256:
        landmarkRetrainLocalPreflightReceipt.local_preflight?.cache?.rows_json
          ?.sha256 ?? null,
      splits_sha256:
        landmarkRetrainLocalPreflightReceipt.local_preflight?.cache?.splits_json
          ?.sha256 ?? null,
      shape_match_rows:
        landmarkRetrainLocalPreflightReceipt.local_preflight?.cache?.arrays
          ?.shape_match_rows ?? null,
      planned_outputs:
        landmarkRetrainLocalPreflightReceipt.local_preflight?.planned_outputs ?? null,
      training_run:
        landmarkRetrainLocalPreflightReceipt.runtime_boundary?.training_run ?? null,
      next_action: landmarkRetrainLocalPreflightReceipt.next_action ?? null,
    },
    "landmark retrain local preflight must match the approval-gated plan, prove local trainer/cache readiness, keep planned outputs absent, and record no Brev/training launch",
  );
  addCheck(
    checks,
    blockers,
    "brev_readiness_refresh_records_visibility_only_worker_state",
    brevReadinessRefreshReceipt.schema_version
      === "asl-pilot-m3jb-brev-readiness-refresh/v1"
      && brevReadinessRefreshReceipt.status
        === "passed_read_only_brev_visibility_launch_blocked_pending_approval"
      && brevReadinessRefreshReceipt.approval_state
        ?.current_thread_explicit_brev_spend_approval === false
      && brevReadinessRefreshReceipt.approval_state
        ?.effective_launch_allowed_now === false
      && brevReadinessRefreshReceipt.plan_match?.planned_instance
        === landmarkRetrainBrevPlanReceipt.planned_remote?.preferred_instance
      && brevReadinessRefreshReceipt.plan_match?.selected_worker_matches_plan
        === true
      && brevReadinessRefreshReceipt.read_only_brev_visibility?.status === "passed"
      && brevReadinessRefreshReceipt.read_only_brev_visibility?.visibility_only
        === true
      && brevReadinessRefreshReceipt.read_only_brev_visibility
        ?.launch_or_lifecycle_action === false
      && brevReadinessRefreshReceipt.read_only_brev_visibility?.selected_worker
        ?.name === landmarkRetrainBrevPlanReceipt.planned_remote?.preferred_instance
      && brevReadinessRefreshReceipt.read_only_brev_visibility?.selected_worker
        ?.id === "3d58wpy9o"
      && brevReadinessRefreshReceipt.read_only_brev_visibility?.selected_worker
        ?.status === "RUNNING"
      && brevReadinessRefreshReceipt.read_only_brev_visibility?.selected_worker
        ?.shell_status === "READY"
      && brevReadinessRefreshReceipt.read_only_brev_visibility?.selected_worker
        ?.health_status === "HEALTHY"
      && brevReadinessRefreshReceipt.read_only_brev_visibility
        ?.worker_readiness_for_approved_launch === true
      && brevReadinessRefreshReceipt.actual_launch?.status === "not_run"
      && brevReadinessRefreshReceipt.runtime_boundary
        ?.read_only_brev_visibility_only === true
      && brevReadinessRefreshReceipt.runtime_boundary?.brev_exec_or_copy === false
      && brevReadinessRefreshReceipt.runtime_boundary?.brev_sync === false
      && brevReadinessRefreshReceipt.runtime_boundary?.brev_lifecycle_action === false
      && brevReadinessRefreshReceipt.runtime_boundary?.worker_created === false
      && brevReadinessRefreshReceipt.runtime_boundary?.remote_mutation === false
      && brevReadinessRefreshReceipt.runtime_boundary?.training_run === false
      && brevReadinessRefreshReceipt.runtime_boundary?.eval_only_pck_run === false
      && brevReadinessRefreshReceipt.runtime_boundary?.checkpoint_written === false
      && brevReadinessRefreshReceipt.next_action
        === "await_explicit_brev_spend_approval_then_launch_landmark_retrain_brev_plan",
    {
      path: brevReadinessRefreshReceiptPath,
      status: brevReadinessRefreshReceipt.status ?? null,
      planned_instance:
        landmarkRetrainBrevPlanReceipt.planned_remote?.preferred_instance ?? null,
      observed_worker:
        brevReadinessRefreshReceipt.read_only_brev_visibility?.selected_worker ?? null,
      visibility_only:
        brevReadinessRefreshReceipt.read_only_brev_visibility?.visibility_only ??
        null,
      launch_or_lifecycle_action:
        brevReadinessRefreshReceipt.read_only_brev_visibility
          ?.launch_or_lifecycle_action ?? null,
      effective_launch_allowed_now:
        brevReadinessRefreshReceipt.approval_state?.effective_launch_allowed_now ??
        null,
      actual_launch_status:
        brevReadinessRefreshReceipt.actual_launch?.status ?? null,
      training_run:
        brevReadinessRefreshReceipt.runtime_boundary?.training_run ?? null,
      next_action: brevReadinessRefreshReceipt.next_action ?? null,
    },
    "Brev readiness refresh must record visibility-only worker state for the planned retained worker while keeping approval, launch, lifecycle, remote mutation, and training blocked",
  );
  addCheck(
    checks,
    blockers,
    "brev_approval_request_records_current_thread_authorization_envelope",
    brevApprovalRequestReceipt.schema_version
      === "asl-pilot-m3jb-brev-approval-request/v1"
      && brevApprovalRequestReceipt.status
        === "completed_approved_launch_consumed_no_gate_pass"
      && brevApprovalRequestReceipt.approval_state
        ?.current_thread_explicit_brev_spend_approval === true
      && brevApprovalRequestReceipt.approval_state?.effective_launch_allowed_now
        === false
      && brevApprovalRequestReceipt.approval_state?.approval_recorded_by_this_receipt
        === true
      && brevApprovalRequestReceipt.approval_state?.approval_consumed_by_run
        === true
      && brevApprovalRequestReceipt.approval_state?.consumed_run_receipt
        === landmarkRetrainBrevRunReceiptPath
      && brevApprovalRequestReceipt.approval_state
        ?.requires_user_reply_in_current_thread === false
      && brevApprovalRequestReceipt.approval_state?.approval_record
        ?.exact_approval_text === landmarkRetrainApprovalText
      && brevApprovalRequestReceipt.approval_state?.approval_record
        ?.approved_worker === "asl-pilot-m3eh-l40s-001"
      && brevApprovalRequestReceipt.approval_state?.approval_record
        ?.approved_worker_id === "3d58wpy9o"
      && brevApprovalRequestReceipt.approval_state?.approval_record?.max_spend_usd
        === 40
      && brevApprovalRequestReceipt.approval_state?.approval_record
        ?.max_outer_runtime_seconds === 21600
      && typeof brevApprovalRequestReceipt.approval_request
        ?.exact_approval_text === "string"
      && brevApprovalRequestReceipt.approval_request.exact_approval_text.includes(
        "I approve current-thread Brev/GPU spend for M3JB landmark retrain plan v1",
      )
      && brevApprovalRequestReceipt.approval_request.exact_approval_text.includes(
        "max spend $40",
      )
      && brevApprovalRequestReceipt.approval_request.exact_approval_text.includes(
        "max outer runtime 21600s",
      )
      && brevApprovalRequestReceipt.authorization_envelope_if_approved
        ?.plan_receipt === landmarkRetrainBrevPlanReceiptPath
      && brevApprovalRequestReceipt.authorization_envelope_if_approved
        ?.preferred_instance
        === landmarkRetrainBrevPlanReceipt.planned_remote?.preferred_instance
      && brevApprovalRequestReceipt.authorization_envelope_if_approved
        ?.preferred_instance_id === "3d58wpy9o"
      && brevApprovalRequestReceipt.authorization_envelope_if_approved?.max_spend_usd
        === landmarkRetrainBrevPlanReceipt.planned_remote?.max_spend_usd
      && brevApprovalRequestReceipt.authorization_envelope_if_approved
        ?.max_runtime_seconds?.outer_timeout
        === landmarkRetrainBrevPlanReceipt.planned_remote?.max_runtime_seconds
          ?.outer_timeout
      && brevApprovalRequestReceipt.authorization_envelope_if_approved
        ?.training_command === landmarkRetrainBrevPlanReceipt.training_plan?.command
      && brevApprovalRequestReceipt.prerequisites?.landmark_retrain_plan_status
        === "approved_pending_launch"
      && brevApprovalRequestReceipt.prerequisites?.local_preflight_status
        === landmarkRetrainLocalPreflightReceipt.status
      && brevApprovalRequestReceipt.prerequisites?.brev_readiness_status
        === brevReadinessRefreshReceipt.status
      && brevApprovalRequestReceipt.prerequisites?.selected_worker_status
        === brevReadinessRefreshReceipt.read_only_brev_visibility?.selected_worker
          ?.status
      && brevApprovalRequestReceipt.prerequisites?.cache_rows
        === landmarkRetrainBrevPlanReceipt.source_inputs?.cache_summary?.rows_after
      && brevApprovalRequestReceipt.prerequisites?.scratch_train === true
      && brevApprovalRequestReceipt.prerequisites?.warm_start_or_init_weights
        === false
      && brevApprovalRequestReceipt.prerequisites?.max_train_rows_cap === null
      && brevApprovalRequestReceipt.actual_launch?.status
        === "completed_rejected_below_baseline_and_gate"
      && brevApprovalRequestReceipt.actual_launch?.run_receipt
        === landmarkRetrainBrevRunReceiptPath
      && brevApprovalRequestReceipt.actual_launch?.metrics?.eval_pck_010
        === 0.6484
      && brevApprovalRequestReceipt.actual_launch?.metrics?.eval_pck_005
        === 0.3651
      && brevApprovalRequestReceipt.actual_launch?.metrics?.decision
        === "rejected_fail_closed_below_rebuilt_cache_baseline_and_gate"
      && brevApprovalRequestReceipt.actual_launch?.worker_teardown?.final_status
        === "STOPPED"
      && brevApprovalRequestReceipt.runtime_boundary?.local_only_this_slice === true
      && brevApprovalRequestReceipt.runtime_boundary?.brev_exec_or_copy === false
      && brevApprovalRequestReceipt.runtime_boundary?.brev_sync === false
      && brevApprovalRequestReceipt.runtime_boundary?.brev_lifecycle_action
        === false
      && brevApprovalRequestReceipt.runtime_boundary?.worker_created === false
      && brevApprovalRequestReceipt.runtime_boundary?.remote_mutation === false
      && brevApprovalRequestReceipt.runtime_boundary?.training_run === false
      && brevApprovalRequestReceipt.runtime_boundary?.eval_only_pck_run === false
      && brevApprovalRequestReceipt.runtime_boundary?.checkpoint_written === false
      && brevApprovalRequestReceipt.next_action
        === landmarkRetrainRegressionPivotNextAction,
    {
      path: brevApprovalRequestReceiptPath,
      status: brevApprovalRequestReceipt.status ?? null,
      approval_recorded_by_this_receipt:
        brevApprovalRequestReceipt.approval_state
          ?.approval_recorded_by_this_receipt ?? null,
      exact_approval_text:
        brevApprovalRequestReceipt.approval_request?.exact_approval_text ?? null,
      preferred_instance:
        brevApprovalRequestReceipt.authorization_envelope_if_approved
          ?.preferred_instance ?? null,
      max_spend_usd:
        brevApprovalRequestReceipt.authorization_envelope_if_approved
          ?.max_spend_usd ?? null,
      outer_timeout:
        brevApprovalRequestReceipt.authorization_envelope_if_approved
          ?.max_runtime_seconds?.outer_timeout ?? null,
      launch_status: brevApprovalRequestReceipt.actual_launch?.status ?? null,
      actual_launch: brevApprovalRequestReceipt.actual_launch ?? null,
      training_run:
        brevApprovalRequestReceipt.runtime_boundary?.training_run ?? null,
      next_action: brevApprovalRequestReceipt.next_action ?? null,
    },
    "Brev approval request must record current-thread approval, the exact bounded envelope, consumed approval, failed launch outcome, stopped worker, and local pivot next action",
  );
  addCheck(
    checks,
    blockers,
    "brev_approval_blocker_records_resolved_current_thread_approval",
    brevApprovalBlockerReceipt.schema_version
      === "asl-pilot-m3jb-brev-approval-blocker/v1"
      && brevApprovalBlockerReceipt.status
        === "resolved_and_launch_completed_rejected_fail_closed"
      && brevApprovalBlockerReceipt.repeated_blocker?.condition
        === "missing_explicit_current_thread_brev_gpu_spend_approval"
      && Number.isFinite(
        brevApprovalBlockerReceipt.repeated_blocker?.consecutive_goal_turns_observed,
      )
      && brevApprovalBlockerReceipt.repeated_blocker
        .consecutive_goal_turns_observed >= 3
      && Array.isArray(brevApprovalBlockerReceipt.repeated_blocker?.evidence_sessions)
      && brevApprovalBlockerReceipt.repeated_blocker.evidence_sessions.includes("897")
      && brevApprovalBlockerReceipt.repeated_blocker.evidence_sessions.includes("898")
      && brevApprovalBlockerReceipt.repeated_blocker.evidence_sessions.includes("899")
      && brevApprovalBlockerReceipt.repeated_blocker.evidence_sessions.includes("900")
      && brevApprovalBlockerReceipt.repeated_blocker.evidence_sessions.includes("901")
      && brevApprovalBlockerReceipt.repeated_blocker
        ?.meaningful_progress_remaining_without_external_approval === false
      && brevApprovalBlockerReceipt.resolution?.condition
        === "current_thread_brev_gpu_spend_approval_recorded"
      && brevApprovalBlockerReceipt.resolution?.exact_approval_text
        === landmarkRetrainApprovalText
      && brevApprovalBlockerReceipt.approval_state
        ?.current_thread_explicit_brev_spend_approval === true
      && brevApprovalBlockerReceipt.approval_state?.effective_launch_allowed_now
        === false
      && brevApprovalBlockerReceipt.approval_state?.approval_consumed_by_run
        === true
      && brevApprovalBlockerReceipt.approval_state?.consumed_run_receipt
        === landmarkRetrainBrevRunReceiptPath
      && brevApprovalBlockerReceipt.approval_state?.required_approval_receipt
        === brevApprovalRequestReceiptPath
      && brevApprovalBlockerReceipt.approval_state?.exact_approval_text
        === brevApprovalRequestReceipt.approval_request?.exact_approval_text
      && brevApprovalBlockerReceipt.approval_state?.approval_record
        ?.exact_approval_text === landmarkRetrainApprovalText
      && brevApprovalBlockerReceipt.resolution?.launch_status
        === "completed_rejected_below_baseline_and_gate"
      && brevApprovalBlockerReceipt.resolution?.run_receipt
        === landmarkRetrainBrevRunReceiptPath
      && brevApprovalBlockerReceipt.resolution?.metrics?.eval_pck_010 === 0.6484
      && brevApprovalBlockerReceipt.resolution?.metrics?.eval_pck_005 === 0.3651
      && brevApprovalBlockerReceipt.resolution?.metrics?.decision
        === "rejected_fail_closed_below_rebuilt_cache_baseline_and_gate"
      && brevApprovalBlockerReceipt.actual_launch?.status
        === "completed_rejected_below_baseline_and_gate"
      && brevApprovalBlockerReceipt.actual_launch?.run_receipt
        === landmarkRetrainBrevRunReceiptPath
      && brevApprovalBlockerReceipt.actual_launch?.worker_teardown?.final_status
        === "STOPPED"
      && brevApprovalBlockerReceipt.runtime_boundary?.local_only_this_slice === true
      && brevApprovalBlockerReceipt.runtime_boundary?.brev_exec_or_copy === false
      && brevApprovalBlockerReceipt.runtime_boundary?.brev_sync === false
      && brevApprovalBlockerReceipt.runtime_boundary?.brev_lifecycle_action
        === false
      && brevApprovalBlockerReceipt.runtime_boundary?.worker_created === false
      && brevApprovalBlockerReceipt.runtime_boundary?.remote_mutation === false
      && brevApprovalBlockerReceipt.runtime_boundary?.training_run === false
      && brevApprovalBlockerReceipt.runtime_boundary?.eval_only_pck_run === false
      && brevApprovalBlockerReceipt.runtime_boundary?.checkpoint_written === false
      && brevApprovalBlockerReceipt.runtime_boundary?.browser_artifact_promoted
        === false
      && brevApprovalBlockerReceipt.runtime_boundary?.raw_learner_video_upload
        === false
      && brevApprovalBlockerReceipt.runtime_boundary
        ?.pretrained_runtime_dependency_added === false
      && brevApprovalBlockerReceipt.next_action
        === landmarkRetrainRegressionPivotNextAction,
    {
      path: brevApprovalBlockerReceiptPath,
      status: brevApprovalBlockerReceipt.status ?? null,
      consecutive_goal_turns_observed:
        brevApprovalBlockerReceipt.repeated_blocker
          ?.consecutive_goal_turns_observed ?? null,
      approval_allowed_now:
        brevApprovalBlockerReceipt.approval_state?.effective_launch_allowed_now ??
        null,
      launch_status: brevApprovalBlockerReceipt.actual_launch?.status ?? null,
      actual_launch: brevApprovalBlockerReceipt.actual_launch ?? null,
      resolution: brevApprovalBlockerReceipt.resolution ?? null,
      training_run:
        brevApprovalBlockerReceipt.runtime_boundary?.training_run ?? null,
      next_action: brevApprovalBlockerReceipt.next_action ?? null,
    },
    "Brev approval blocker must preserve the prior missing-approval history, record current resolution, consumed approval, failed launch outcome, stopped worker, and browser/raw/pretrained boundaries",
  );
  addCheck(
    checks,
    blockers,
    "codex_supervisor_dry_run_records_no_launch_boundary",
    codexSupervisorDryRunReceipt.schema_version
      === "asl-pilot-m3jb-codex-supervisor-dry-run/v1"
      && codexSupervisorDryRunReceipt.status
        === "passed_dry_run_actual_launch_blocked_pending_brev_approval"
      && codexSupervisorDryRunReceipt.dry_run?.status === "passed"
      && codexSupervisorDryRunReceipt.dry_run?.generated_supervisor_script
        ?.codex_profile === "asl-pilot-local-skills"
      && codexSupervisorDryRunReceipt.dry_run?.generated_supervisor_script
        ?.launch_command === "exec bash scripts/run_codex_pair_cycle.sh --loop"
      && codexSupervisorDryRunReceipt.actual_launch?.status === "not_run"
      && codexSupervisorDryRunReceipt.actual_launch?.preferred_mode === "supervisor"
      && codexSupervisorDryRunReceipt.runtime_boundary?.codex_loop_launched === false
      && codexSupervisorDryRunReceipt.runtime_boundary?.executor_turn_started === false
      && codexSupervisorDryRunReceipt.runtime_boundary?.observer_turn_started === false
      && codexSupervisorDryRunReceipt.runtime_boundary?.brev_exec_or_copy === false
      && codexSupervisorDryRunReceipt.runtime_boundary?.training_run === false
      && codexSupervisorDryRunReceipt.tracker_state_before?.brev_spend_approval
        ?.effective_launch_allowed_now === false
      && codexSupervisorDryRunReceipt.next_action
        === "await_explicit_brev_spend_approval_then_launch_landmark_retrain_brev_plan",
    {
      path: codexSupervisorDryRunReceiptPath,
      status: codexSupervisorDryRunReceipt.status ?? null,
      dry_run_status: codexSupervisorDryRunReceipt.dry_run?.status ?? null,
      codex_profile:
        codexSupervisorDryRunReceipt.dry_run?.generated_supervisor_script
          ?.codex_profile ?? null,
      actual_launch_status: codexSupervisorDryRunReceipt.actual_launch?.status ?? null,
      codex_loop_launched:
        codexSupervisorDryRunReceipt.runtime_boundary?.codex_loop_launched ?? null,
      effective_launch_allowed_now:
        codexSupervisorDryRunReceipt.tracker_state_before?.brev_spend_approval
          ?.effective_launch_allowed_now ?? null,
      next_action: codexSupervisorDryRunReceipt.next_action ?? null,
    },
    "Codex supervisor dry-run receipt must prove the local-skills supervisor launch path without starting Codex, Brev, or training",
  );
  addCheck(
    checks,
    blockers,
    "codex_both_dry_run_records_no_launch_boundary",
    codexBothDryRunReceipt.schema_version
      === "asl-pilot-m3jb-codex-both-dry-run/v1"
      && codexBothDryRunReceipt.status
        === "passed_both_dry_run_actual_launch_blocked_pending_brev_approval"
      && codexBothDryRunReceipt.dry_run?.status === "passed"
      && codexBothDryRunReceipt.dry_run?.generated_executor_script
        ?.codex_profile === "asl-pilot-local-skills"
      && codexBothDryRunReceipt.dry_run?.generated_observer_script
        ?.codex_profile === "asl-pilot-local-skills"
      && codexBothDryRunReceipt.actual_launch?.status === "not_run"
      && codexBothDryRunReceipt.actual_launch?.command
        === "bash scripts/start_codex_goal_loop.sh --role both"
      && codexBothDryRunReceipt.runtime_boundary?.codex_both_loop_launched === false
      && codexBothDryRunReceipt.runtime_boundary?.executor_loop_started === false
      && codexBothDryRunReceipt.runtime_boundary?.observer_loop_started === false
      && codexBothDryRunReceipt.runtime_boundary?.executor_turn_started === false
      && codexBothDryRunReceipt.runtime_boundary?.observer_turn_started === false
      && codexBothDryRunReceipt.runtime_boundary?.brev_exec_or_copy === false
      && codexBothDryRunReceipt.runtime_boundary?.training_run === false
      && codexBothDryRunReceipt.tracker_state_before?.brev_spend_approval
        ?.effective_launch_allowed_now === false
      && codexBothDryRunReceipt.next_action
        === "await_explicit_brev_spend_approval_then_launch_landmark_retrain_brev_plan",
    {
      path: codexBothDryRunReceiptPath,
      status: codexBothDryRunReceipt.status ?? null,
      dry_run_status: codexBothDryRunReceipt.dry_run?.status ?? null,
      executor_codex_profile:
        codexBothDryRunReceipt.dry_run?.generated_executor_script
          ?.codex_profile ?? null,
      observer_codex_profile:
        codexBothDryRunReceipt.dry_run?.generated_observer_script
          ?.codex_profile ?? null,
      actual_launch_status: codexBothDryRunReceipt.actual_launch?.status ?? null,
      actual_launch_command: codexBothDryRunReceipt.actual_launch?.command ?? null,
      codex_both_loop_launched:
        codexBothDryRunReceipt.runtime_boundary?.codex_both_loop_launched ?? null,
      effective_launch_allowed_now:
        codexBothDryRunReceipt.tracker_state_before?.brev_spend_approval
          ?.effective_launch_allowed_now ?? null,
      next_action: codexBothDryRunReceipt.next_action ?? null,
    },
    "Codex both-role dry-run receipt must prove the local-skills executor/observer launch path without starting Codex, Brev, or training",
  );
  addCheck(
    checks,
    blockers,
    "landmark_relabel_candidate_backlog_recorded",
    landmarkRelabelCandidateBacklog?.test_candidates?.selected_candidate_count === 512
      && landmarkRelabelCandidateBacklog?.train_candidates?.selected_candidate_count === 1024
      && landmarkRelabelCandidateBacklog?.test_candidates?.dominant_recommended_action?.action
        === "rebuild_crop_with_more_context_or_mask_oob_keypoints"
      && landmarkRelabelCandidateBacklog?.train_candidates?.dominant_recommended_action?.action
        === "rebuild_crop_with_more_context_or_mask_oob_keypoints",
    {
      test_selected:
        landmarkRelabelCandidateBacklog?.test_candidates?.selected_candidate_count ?? null,
      train_selected:
        landmarkRelabelCandidateBacklog?.train_candidates?.selected_candidate_count ?? null,
      test_dominant_action:
        landmarkRelabelCandidateBacklog?.test_candidates?.dominant_recommended_action ?? null,
      train_dominant_action:
        landmarkRelabelCandidateBacklog?.train_candidates?.dominant_recommended_action ?? null,
    },
    "landmark relabel candidate backlog must record the fixed train/test crop-quality review set",
  );
  addCheck(
    checks,
    blockers,
    "landmark_oob_mask_policy_probe_recorded",
    landmarkOobMaskPolicyProbe?.status === "masking_helpful_but_insufficient_crop_rebuild_required"
      && landmarkOobMaskPolicyProbe.test_candidates?.visible_pck_gte_090 === 0
      && landmarkOobMaskPolicyProbe.train_candidates?.visible_pck_gte_090 === 0
      && (landmarkOobMaskPolicyProbe.quality_deltas?.test?.oob?.visible_minus_all_pck_010 ?? 0) > 0
      && (landmarkOobMaskPolicyProbe.quality_deltas?.train?.oob?.visible_minus_all_pck_010 ?? 0) > 0,
    {
      status: landmarkOobMaskPolicyProbe?.status ?? null,
      test_visible_pck_gte_090:
        landmarkOobMaskPolicyProbe?.test_candidates?.visible_pck_gte_090 ?? null,
      train_visible_pck_gte_090:
        landmarkOobMaskPolicyProbe?.train_candidates?.visible_pck_gte_090 ?? null,
      test_oob_visible_delta:
        landmarkOobMaskPolicyProbe?.quality_deltas?.test?.oob?.visible_minus_all_pck_010 ?? null,
      train_oob_visible_delta:
        landmarkOobMaskPolicyProbe?.quality_deltas?.train?.oob?.visible_minus_all_pck_010 ?? null,
      recommended_next_action: landmarkOobMaskPolicyProbe?.recommended_next_action ?? null,
    },
    "landmark OOB mask policy probe must prove whether visible-keypoint masking is sufficient",
  );
  addCheck(
    checks,
    blockers,
    "landmark_crop_context_geometry_probe_recorded",
    landmarkCropContextGeometryProbe?.status
      === "source_crop_context_rebuild_ceiling_low_targeted_relabel_required"
      && landmarkCropContextGeometryProbe.test_candidates?.teacher_edge_count === 369
      && landmarkCropContextGeometryProbe.test_candidates?.source_expand_resolved_teacher_edge_count === 2
      && landmarkCropContextGeometryProbe.train_candidates?.teacher_edge_count === 823
      && landmarkCropContextGeometryProbe.train_candidates?.source_expand_resolved_teacher_edge_count === 22,
    {
      status: landmarkCropContextGeometryProbe?.status ?? null,
      test_teacher_edge_count:
        landmarkCropContextGeometryProbe?.test_candidates?.teacher_edge_count ?? null,
      test_source_expand_resolved:
        landmarkCropContextGeometryProbe?.test_candidates
          ?.source_expand_resolved_teacher_edge_count ?? null,
      test_full_frame_unresolved:
        landmarkCropContextGeometryProbe?.test_candidates
          ?.full_frame_relabel_crop_unresolved_teacher_edge_count ?? null,
      train_teacher_edge_count:
        landmarkCropContextGeometryProbe?.train_candidates?.teacher_edge_count ?? null,
      train_source_expand_resolved:
        landmarkCropContextGeometryProbe?.train_candidates
          ?.source_expand_resolved_teacher_edge_count ?? null,
      train_full_frame_unresolved:
        landmarkCropContextGeometryProbe?.train_candidates
          ?.full_frame_relabel_crop_unresolved_teacher_edge_count ?? null,
      recommended_next_action:
        landmarkCropContextGeometryProbe?.recommended_next_action ?? null,
    },
    "landmark crop context geometry probe must record the source-crop expansion ceiling",
  );
  addCheck(
    checks,
    blockers,
    "landmark_targeted_relabel_queue_recorded",
    landmarkTargetedRelabelQueue?.status === "ready_for_bounded_local_targeted_relabel_smoke"
      && landmarkTargetedRelabelQueue.test_candidates?.frame_edge_candidate_count === 367
      && landmarkTargetedRelabelQueue.train_candidates?.frame_edge_candidate_count === 801
      && landmarkTargetedRelabelQueue.test_candidates?.raw_video_missing_count === 0
      && landmarkTargetedRelabelQueue.train_candidates?.raw_video_missing_count === 0
      && landmarkTargetedRelabelQueue.test_candidates?.manifest_prefix_frame_edge_counts?.top32 === 32
      && landmarkTargetedRelabelQueue.train_candidates?.manifest_prefix_frame_edge_counts?.top32 === 32
      && exists(sideLabelPython),
    {
      status: landmarkTargetedRelabelQueue?.status ?? null,
      test_frame_edge_candidates:
        landmarkTargetedRelabelQueue?.test_candidates?.frame_edge_candidate_count ?? null,
      train_frame_edge_candidates:
        landmarkTargetedRelabelQueue?.train_candidates?.frame_edge_candidate_count ?? null,
      test_raw_video_missing:
        landmarkTargetedRelabelQueue?.test_candidates?.raw_video_missing_count ?? null,
      train_raw_video_missing:
        landmarkTargetedRelabelQueue?.train_candidates?.raw_video_missing_count ?? null,
      test_top32_frame_edge:
        landmarkTargetedRelabelQueue?.test_candidates?.manifest_prefix_frame_edge_counts?.top32
        ?? null,
      train_top32_frame_edge:
        landmarkTargetedRelabelQueue?.train_candidates?.manifest_prefix_frame_edge_counts?.top32
        ?? null,
      interpreter: exists(sideLabelPython) ? rel(sideLabelPython) : null,
      recommended_next_action: landmarkTargetedRelabelQueue?.recommended_next_action ?? null,
    },
    "landmark targeted relabel queue must record frame-edge candidates with available source video and a bounded top-32 local smoke plan",
  );
  addCheck(
    checks,
    blockers,
    "landmark_targeted_relabel_smoke_recorded",
    landmarkTargetedRelabelSmoke?.status === "strict_acceptance_low_yield_not_cache_rebuild_ready"
      && landmarkTargetedRelabelSmoke.train_top32?.stats?.processed === 32
      && landmarkTargetedRelabelSmoke.train_top32?.stats?.missing === 0
      && landmarkTargetedRelabelSmoke.train_top32?.stats?.selected_detected === 22
      && landmarkTargetedRelabelSmoke.train_top32?.stats?.written === 1
      && landmarkTargetedRelabelSmoke.test_top32_diagnostic?.stats?.processed === 32
      && landmarkTargetedRelabelSmoke.test_top32_diagnostic?.stats?.missing === 0
      && landmarkTargetedRelabelSmoke.test_top32_diagnostic?.stats?.selected_detected === 30
      && landmarkTargetedRelabelSmoke.test_top32_diagnostic?.stats?.written === 0,
    {
      status: landmarkTargetedRelabelSmoke?.status ?? null,
      train_processed: landmarkTargetedRelabelSmoke?.train_top32?.stats?.processed ?? null,
      train_selected_detected:
        landmarkTargetedRelabelSmoke?.train_top32?.stats?.selected_detected ?? null,
      train_written: landmarkTargetedRelabelSmoke?.train_top32?.stats?.written ?? null,
      train_rejected_visible_frac:
        landmarkTargetedRelabelSmoke?.train_top32?.stats?.rejected_visible_frac ?? null,
      train_rejected_oob_points:
        landmarkTargetedRelabelSmoke?.train_top32?.stats?.rejected_oob_points ?? null,
      test_processed:
        landmarkTargetedRelabelSmoke?.test_top32_diagnostic?.stats?.processed ?? null,
      test_selected_detected:
        landmarkTargetedRelabelSmoke?.test_top32_diagnostic?.stats?.selected_detected ?? null,
      test_written: landmarkTargetedRelabelSmoke?.test_top32_diagnostic?.stats?.written ?? null,
      test_rejected_visible_frac:
        landmarkTargetedRelabelSmoke?.test_top32_diagnostic?.stats?.rejected_visible_frac ?? null,
      test_rejected_oob_points:
        landmarkTargetedRelabelSmoke?.test_top32_diagnostic?.stats?.rejected_oob_points ?? null,
      recommended_next_action: landmarkTargetedRelabelSmoke?.recommended_next_action ?? null,
    },
    "landmark targeted relabel smoke must record strict top-32 recovery yield before cache rebuild",
  );
  addCheck(
    checks,
    blockers,
    "landmark_targeted_relabel_acceptance_diagnostic_recorded",
    landmarkTargetedRelabelAcceptanceDiagnostic?.status
      === "selected_only_quality_distribution_confirms_true_frame_edge_policy_needed"
      && landmarkTargetedRelabelAcceptanceDiagnostic.train_top32_selected_only?.stats?.written === 22
      && landmarkTargetedRelabelAcceptanceDiagnostic.test_top32_selected_only?.stats?.written === 30
      && landmarkTargetedRelabelAcceptanceDiagnostic.train_top32_selected_only
        ?.selected_quality_summary?.threshold_counts?.visible_050_oob_lte_4 === 1
      && landmarkTargetedRelabelAcceptanceDiagnostic.test_top32_selected_only
        ?.selected_quality_summary?.threshold_counts?.visible_050_oob_lte_4 === 0
      && landmarkTargetedRelabelAcceptanceDiagnostic.test_top32_selected_only
        ?.selected_quality_summary?.visible_frac?.max === 0.619048,
    {
      status: landmarkTargetedRelabelAcceptanceDiagnostic?.status ?? null,
      train_selected_only_written:
        landmarkTargetedRelabelAcceptanceDiagnostic?.train_top32_selected_only
          ?.stats?.written ?? null,
      train_visible_median:
        landmarkTargetedRelabelAcceptanceDiagnostic?.train_top32_selected_only
          ?.selected_quality_summary?.visible_frac?.median ?? null,
      train_oob_median:
        landmarkTargetedRelabelAcceptanceDiagnostic?.train_top32_selected_only
          ?.selected_quality_summary?.oob_points?.median ?? null,
      train_visible050_oob_lte4:
        landmarkTargetedRelabelAcceptanceDiagnostic?.train_top32_selected_only
          ?.selected_quality_summary?.threshold_counts?.visible_050_oob_lte_4 ?? null,
      test_selected_only_written:
        landmarkTargetedRelabelAcceptanceDiagnostic?.test_top32_selected_only
          ?.stats?.written ?? null,
      test_visible_max:
        landmarkTargetedRelabelAcceptanceDiagnostic?.test_top32_selected_only
          ?.selected_quality_summary?.visible_frac?.max ?? null,
      test_oob_median:
        landmarkTargetedRelabelAcceptanceDiagnostic?.test_top32_selected_only
          ?.selected_quality_summary?.oob_points?.median ?? null,
      test_visible050_oob_lte4:
        landmarkTargetedRelabelAcceptanceDiagnostic?.test_top32_selected_only
          ?.selected_quality_summary?.threshold_counts?.visible_050_oob_lte_4 ?? null,
      recommended_next_action:
        landmarkTargetedRelabelAcceptanceDiagnostic?.recommended_next_action ?? null,
    },
    "landmark targeted relabel acceptance diagnostic must prove whether threshold relaxation is safe",
  );
  addCheck(
    checks,
    blockers,
    "landmark_frame_edge_cache_policy_decision_recorded",
    landmarkFrameEdgeCachePolicyDecision?.status
      === "selected_only_frame_edge_rows_excluded_from_cache_rebuild_clearer_source_required"
      && landmarkFrameEdgeCachePolicyDecision.aggregate?.selected_row_count === 52
      && landmarkFrameEdgeCachePolicyDecision.aggregate
        ?.cache_rebuild_eligible_moderate_count === 0
      && landmarkFrameEdgeCachePolicyDecision.aggregate
        ?.cache_rebuild_eligible_strict_count === 0
      && landmarkFrameEdgeCachePolicyDecision.aggregate
        ?.severe_frame_edge_oob_exclusion_count === 51
      && landmarkFrameEdgeCachePolicyDecision.aggregate
        ?.hand_key_mismatch_exclusion_count === 4
      && landmarkFrameEdgeCachePolicyDecision.train_top32_policy
        ?.cache_rebuild_eligible_moderate_count === 0
      && landmarkFrameEdgeCachePolicyDecision.test_top32_policy
        ?.cache_rebuild_eligible_moderate_count === 0
      && landmarkFrameEdgeCachePolicyDecision.full_backlog_scope?.train_frame_edge_candidates === 801
      && landmarkFrameEdgeCachePolicyDecision.full_backlog_scope?.test_frame_edge_candidates === 367,
    {
      status: landmarkFrameEdgeCachePolicyDecision?.status ?? null,
      selected_rows:
        landmarkFrameEdgeCachePolicyDecision?.aggregate?.selected_row_count ?? null,
      cache_rebuild_eligible_moderate:
        landmarkFrameEdgeCachePolicyDecision?.aggregate
          ?.cache_rebuild_eligible_moderate_count ?? null,
      cache_rebuild_eligible_strict:
        landmarkFrameEdgeCachePolicyDecision?.aggregate
          ?.cache_rebuild_eligible_strict_count ?? null,
      severe_frame_edge_oob_exclusions:
        landmarkFrameEdgeCachePolicyDecision?.aggregate
          ?.severe_frame_edge_oob_exclusion_count ?? null,
      hand_key_mismatch_exclusions:
        landmarkFrameEdgeCachePolicyDecision?.aggregate
          ?.hand_key_mismatch_exclusion_count ?? null,
      center_distance_exclusions:
        landmarkFrameEdgeCachePolicyDecision?.aggregate
          ?.center_distance_exclusion_count ?? null,
      train_frame_edge_candidates:
        landmarkFrameEdgeCachePolicyDecision?.full_backlog_scope
          ?.train_frame_edge_candidates ?? null,
      test_frame_edge_candidates:
        landmarkFrameEdgeCachePolicyDecision?.full_backlog_scope
          ?.test_frame_edge_candidates ?? null,
      recommended_next_action:
        landmarkFrameEdgeCachePolicyDecision?.recommended_next_action ?? null,
    },
    "landmark frame-edge cache policy must block cache rebuild until clearer-source review or explicit exclusion is recorded",
  );
  const existingFrameEdgeDispositionManifest = exists(frameEdgeDispositionManifestFilePath)
    ? readJson(frameEdgeDispositionManifestFilePath)
    : null;
  addCheck(
    checks,
    blockers,
    "landmark_frame_edge_disposition_manifest_recorded",
    landmarkFrameEdgeDispositionManifest?.schema_version
      === "asl-pilot-m3jb-frame-edge-disposition-manifest/v1"
      && landmarkFrameEdgeDispositionManifest.scope?.full_backlog_materialized === true
      && landmarkFrameEdgeDispositionManifest.summary?.rows === 1168
      && landmarkFrameEdgeDispositionManifest.summary?.selected_only_probe_rows === 52
      && landmarkFrameEdgeDispositionManifest.summary?.cache_rebuild_allowed === 0
      && landmarkFrameEdgeDispositionManifest.summary?.raw_video_missing === 0
      && landmarkFrameEdgeDispositionManifest.summary
        ?.selected_only_excluded_from_cache_rebuild === 52
      && landmarkFrameEdgeDispositionManifest.summary?.clearer_source_review_required === 1116
      && landmarkFrameEdgeDispositionManifest.summary?.severe_frame_edge_oob === 51
      && landmarkFrameEdgeDispositionManifest.summary?.hand_key_mismatch === 4
      && landmarkFrameEdgeDispositionManifest.summary?.center_distance === 1
      && landmarkFrameEdgeDispositionManifest.splits?.train?.summary?.rows === 801
      && landmarkFrameEdgeDispositionManifest.splits?.test?.summary?.rows === 367
      && Array.isArray(landmarkFrameEdgeDispositionManifest.splits?.train?.rows)
      && landmarkFrameEdgeDispositionManifest.splits.train.rows.length === 801
      && Array.isArray(landmarkFrameEdgeDispositionManifest.splits?.test?.rows)
      && landmarkFrameEdgeDispositionManifest.splits.test.rows.length === 367
      && (args.writeReceipt || existingFrameEdgeDispositionManifest?.summary?.rows === 1168),
    {
      path: frameEdgeDispositionManifestPath,
      exists: exists(frameEdgeDispositionManifestFilePath),
      frame_edge_rows: landmarkFrameEdgeDispositionManifest?.summary?.rows ?? null,
      selected_only_probe_rows:
        landmarkFrameEdgeDispositionManifest?.summary?.selected_only_probe_rows ?? null,
      cache_rebuild_allowed:
        landmarkFrameEdgeDispositionManifest?.summary?.cache_rebuild_allowed ?? null,
      raw_video_missing:
        landmarkFrameEdgeDispositionManifest?.summary?.raw_video_missing ?? null,
      selected_only_excluded_from_cache_rebuild:
        landmarkFrameEdgeDispositionManifest?.summary
          ?.selected_only_excluded_from_cache_rebuild ?? null,
      clearer_source_review_required:
        landmarkFrameEdgeDispositionManifest?.summary
          ?.clearer_source_review_required ?? null,
      severe_frame_edge_oob:
        landmarkFrameEdgeDispositionManifest?.summary?.severe_frame_edge_oob ?? null,
      hand_key_mismatch:
        landmarkFrameEdgeDispositionManifest?.summary?.hand_key_mismatch ?? null,
      center_distance:
        landmarkFrameEdgeDispositionManifest?.summary?.center_distance ?? null,
      next_action: landmarkFrameEdgeDispositionManifest?.next_action ?? null,
    },
    "landmark frame-edge disposition manifest must materialize the full frame-edge backlog before cache rebuild",
  );
  const existingFrameEdgeExclusionSeed = exists(frameEdgeExclusionSeedFilePath)
    ? readJson(frameEdgeExclusionSeedFilePath)
    : null;
  addCheck(
    checks,
    blockers,
    "landmark_frame_edge_exclusion_seed_recorded",
    landmarkFrameEdgeExclusionSeed?.schema_version
      === "asl-pilot-m3jb-frame-edge-exclusion-seed/v1"
      && landmarkFrameEdgeExclusionSeed.summary?.rows === 52
      && landmarkFrameEdgeExclusionSeed.summary?.train_rows === 22
      && landmarkFrameEdgeExclusionSeed.summary?.test_rows === 30
      && landmarkFrameEdgeExclusionSeed.summary?.severe_frame_edge_oob === 51
      && landmarkFrameEdgeExclusionSeed.summary?.hand_key_mismatch === 4
      && landmarkFrameEdgeExclusionSeed.summary?.center_distance === 1
      && Array.isArray(landmarkFrameEdgeExclusionSeed.rows)
      && landmarkFrameEdgeExclusionSeed.rows.length === 52
      && landmarkFrameEdgeExclusionSeed.rows.every((row) =>
        row.block_from_landmark_cache_rebuild === true
      )
      && (args.writeReceipt || existingFrameEdgeExclusionSeed?.summary?.rows === 52),
    {
      path: frameEdgeExclusionSeedPath,
      exists: exists(frameEdgeExclusionSeedFilePath),
      rows: landmarkFrameEdgeExclusionSeed?.summary?.rows ?? null,
      train_rows: landmarkFrameEdgeExclusionSeed?.summary?.train_rows ?? null,
      test_rows: landmarkFrameEdgeExclusionSeed?.summary?.test_rows ?? null,
      severe_frame_edge_oob:
        landmarkFrameEdgeExclusionSeed?.summary?.severe_frame_edge_oob ?? null,
      hand_key_mismatch:
        landmarkFrameEdgeExclusionSeed?.summary?.hand_key_mismatch ?? null,
      center_distance:
        landmarkFrameEdgeExclusionSeed?.summary?.center_distance ?? null,
      next_action: landmarkFrameEdgeExclusionSeed?.next_action ?? null,
    },
    "landmark frame-edge exclusion seed must commit selected-only bad rows as cache rebuild exclusions",
  );
  const existingClearerSourceReviewSubset = exists(clearerSourceReviewSubsetFilePath)
    ? readJson(clearerSourceReviewSubsetFilePath)
    : null;
  addCheck(
    checks,
    blockers,
    "landmark_clearer_source_review_subset_recorded",
    landmarkClearerSourceReviewSubset?.schema_version
      === "asl-pilot-m3jb-clearer-source-review-subset/v1"
      && landmarkClearerSourceReviewSubset.summary?.pool_rows === 1116
      && landmarkClearerSourceReviewSubset.summary?.pool_train_rows === 779
      && landmarkClearerSourceReviewSubset.summary?.pool_test_rows === 337
      && landmarkClearerSourceReviewSubset.summary?.selected_rows === 64
      && landmarkClearerSourceReviewSubset.summary?.selected_train_rows === 32
      && landmarkClearerSourceReviewSubset.summary?.selected_test_rows === 32
      && landmarkClearerSourceReviewSubset.summary?.raw_video_missing === 0
      && landmarkClearerSourceReviewSubset.summary?.cache_rebuild_allowed === 0
      && Array.isArray(landmarkClearerSourceReviewSubset.splits?.train?.rows)
      && landmarkClearerSourceReviewSubset.splits.train.rows.length === 32
      && Array.isArray(landmarkClearerSourceReviewSubset.splits?.test?.rows)
      && landmarkClearerSourceReviewSubset.splits.test.rows.length === 32
      && landmarkClearerSourceReviewSubset.splits.train.rows.every((row) =>
        row.review_reason === "clearer_source_review_required_before_cache_rebuild"
          && row.cache_rebuild_allowed === false
      )
      && landmarkClearerSourceReviewSubset.splits.test.rows.every((row) =>
        row.review_reason === "clearer_source_review_required_before_cache_rebuild"
          && row.cache_rebuild_allowed === false
      )
      && (args.writeReceipt || existingClearerSourceReviewSubset?.summary?.selected_rows === 64),
    {
      path: clearerSourceReviewSubsetPath,
      exists: exists(clearerSourceReviewSubsetFilePath),
      pool_rows: landmarkClearerSourceReviewSubset?.summary?.pool_rows ?? null,
      selected_rows: landmarkClearerSourceReviewSubset?.summary?.selected_rows ?? null,
      selected_train_rows:
        landmarkClearerSourceReviewSubset?.summary?.selected_train_rows ?? null,
      selected_test_rows:
        landmarkClearerSourceReviewSubset?.summary?.selected_test_rows ?? null,
      selected_unique_labels:
        landmarkClearerSourceReviewSubset?.summary?.selected_unique_labels ?? null,
      raw_video_missing:
        landmarkClearerSourceReviewSubset?.summary?.raw_video_missing ?? null,
      cache_rebuild_allowed:
        landmarkClearerSourceReviewSubset?.summary?.cache_rebuild_allowed ?? null,
      next_action: landmarkClearerSourceReviewSubset?.next_action ?? null,
    },
    "landmark clearer-source review subset must select a bounded no-cache-review set from the 1116 unprobed frame-edge rows",
  );
  addCheck(
    checks,
    blockers,
    "landmark_clearer_source_review_outcomes_validated",
    landmarkClearerSourceReviewOutcomes?.schema_version
      === "asl-pilot-m3jb-clearer-source-review-outcomes/v1"
      && landmarkClearerSourceReviewOutcomes.summary?.selected_rows === 64
      && landmarkClearerSourceReviewOutcomes.summary?.train_rows === 32
      && landmarkClearerSourceReviewOutcomes.summary?.test_rows === 32
      && landmarkClearerSourceReviewOutcomes.validation?.status === "passed"
      && landmarkClearerSourceReviewOutcomes.validation?.invalid_rows === 0
      && landmarkClearerSourceReviewOutcomes.summary?.selected_rows
        === landmarkClearerSourceReviewOutcomes.summary?.pending_review
          + landmarkClearerSourceReviewOutcomes.summary?.cache_safe_replacements
          + landmarkClearerSourceReviewOutcomes.summary?.explicit_exclusions
          + landmarkClearerSourceReviewOutcomes.summary?.needs_additional_source_context
      && Array.isArray(landmarkClearerSourceReviewOutcomes.splits?.train?.rows)
      && landmarkClearerSourceReviewOutcomes.splits.train.rows.length === 32
      && Array.isArray(landmarkClearerSourceReviewOutcomes.splits?.test?.rows)
      && landmarkClearerSourceReviewOutcomes.splits.test.rows.length === 32
      && (args.writeReceipt || existingClearerSourceReviewOutcomes?.summary?.selected_rows === 64),
    {
      path: clearerSourceReviewOutcomesPath,
      exists: exists(clearerSourceReviewOutcomesFilePath),
      selected_rows: landmarkClearerSourceReviewOutcomes?.summary?.selected_rows ?? null,
      pending_review: landmarkClearerSourceReviewOutcomes?.summary?.pending_review ?? null,
      cache_safe_replacements:
        landmarkClearerSourceReviewOutcomes?.summary?.cache_safe_replacements ?? null,
      explicit_exclusions:
        landmarkClearerSourceReviewOutcomes?.summary?.explicit_exclusions ?? null,
      needs_additional_source_context:
        landmarkClearerSourceReviewOutcomes?.summary?.needs_additional_source_context ?? null,
      cache_rebuild_allowed:
        landmarkClearerSourceReviewOutcomes?.summary?.cache_rebuild_allowed ?? null,
      validation: landmarkClearerSourceReviewOutcomes?.validation ?? null,
      preservation_contract:
        landmarkClearerSourceReviewOutcomes?.preservation_contract ?? null,
      next_action: landmarkClearerSourceReviewOutcomes?.next_action ?? null,
    },
    "landmark clearer-source review outcomes ledger must preserve and validate reviewer decisions before cache rebuild",
  );
  addCheck(
    checks,
    blockers,
    "landmark_clearer_source_review_outcome_exclusions_recorded",
    landmarkClearerSourceReviewOutcomes?.summary?.explicit_exclusions >= 64
      && landmarkClearerSourceReviewOutcomes?.summary?.pending_review === 0
      && landmarkClearerSourceReviewOutcomes?.summary?.cache_rebuild_allowed === 0
      && landmarkClearerSourceReviewOutcomes?.validation?.status === "passed"
      && landmarkClearerSourceReviewOutcomes?.next_action
        === "rebuild_crop_cache_then_retrain_landmark_student_and_remeasure_pck_after_batch_review",
    {
      path: clearerSourceReviewOutcomesPath,
      explicit_exclusions:
        landmarkClearerSourceReviewOutcomes?.summary?.explicit_exclusions ?? null,
      pending_review: landmarkClearerSourceReviewOutcomes?.summary?.pending_review ?? null,
      cache_rebuild_allowed:
        landmarkClearerSourceReviewOutcomes?.summary?.cache_rebuild_allowed ?? null,
      validation: landmarkClearerSourceReviewOutcomes?.validation ?? null,
      next_action: landmarkClearerSourceReviewOutcomes?.next_action ?? null,
    },
    "landmark clearer-source outcome ledger must record reviewed exclusions without authorizing cache rebuild",
  );
  const existingClearerSourceReviewPacket = exists(clearerSourceReviewPacketFilePath)
    ? readJson(clearerSourceReviewPacketFilePath)
    : null;
  const reviewPacketRows = [
    ...(landmarkClearerSourceReviewPacket?.splits?.train?.rows ?? []),
    ...(landmarkClearerSourceReviewPacket?.splits?.test?.rows ?? []),
  ];
  const clearerSourceReviewComplete =
    landmarkClearerSourceReviewOutcomes?.summary?.pending_review === 0;
  const pendingPacketStateValid =
    landmarkClearerSourceReviewPacket?.summary?.packet_rows === 16
      && landmarkClearerSourceReviewPacket.summary?.train_rows === 8
      && landmarkClearerSourceReviewPacket.summary?.test_rows === 8
      && landmarkClearerSourceReviewPacket.summary?.pending_ledger_rows_represented === 16
      && landmarkClearerSourceReviewPacket.summary?.source_videos_available_local === 16
      && landmarkClearerSourceReviewPacket.summary?.source_videos_missing_local === 0
      && reviewPacketRows.every((row) =>
        row.current_ledger_status?.review_status === pendingReviewStatus
          && row.current_ledger_status?.cache_safe_replacement === null
          && row.current_ledger_status?.explicit_exclusion === null
          && row.current_ledger_status?.cache_rebuild_allowed === false
      );
  const finishedPacketStateValid =
    clearerSourceReviewComplete
      && landmarkClearerSourceReviewPacket?.summary?.packet_rows === 0
      && landmarkClearerSourceReviewPacket.summary?.train_rows === 0
      && landmarkClearerSourceReviewPacket.summary?.test_rows === 0
      && landmarkClearerSourceReviewPacket.summary?.pending_ledger_rows_represented === 0
      && landmarkClearerSourceReviewPacket.summary?.source_videos_available_local === 0
      && landmarkClearerSourceReviewPacket.summary?.source_videos_missing_local === 0
      && reviewPacketRows.length === 0;
  addCheck(
    checks,
    blockers,
    "landmark_clearer_source_review_packet_recorded",
    landmarkClearerSourceReviewPacket?.schema_version
      === "asl-pilot-m3jb-clearer-source-review-packet/v1"
      && (pendingPacketStateValid || finishedPacketStateValid)
      && landmarkClearerSourceReviewPacket.summary?.cache_rebuild_allowed === 0
      && landmarkClearerSourceReviewPacket.summary?.raw_frames_embedded === 0
      && (args.writeReceipt || existingClearerSourceReviewPacket?.schema_version
        === "asl-pilot-m3jb-clearer-source-review-packet/v1"),
    {
      path: clearerSourceReviewPacketPath,
      exists: exists(clearerSourceReviewPacketFilePath),
      packet_rows: landmarkClearerSourceReviewPacket?.summary?.packet_rows ?? null,
      train_rows: landmarkClearerSourceReviewPacket?.summary?.train_rows ?? null,
      test_rows: landmarkClearerSourceReviewPacket?.summary?.test_rows ?? null,
      source_videos_available_local:
        landmarkClearerSourceReviewPacket?.summary?.source_videos_available_local ?? null,
      source_videos_missing_local:
        landmarkClearerSourceReviewPacket?.summary?.source_videos_missing_local ?? null,
      raw_frames_embedded:
        landmarkClearerSourceReviewPacket?.summary?.raw_frames_embedded ?? null,
      next_action: landmarkClearerSourceReviewPacket?.next_action ?? null,
    },
    "landmark clearer-source review packet must bind the first 16 pending ledger rows without embedding frames or authorizing cache rebuild",
  );
  const landmarkMetrics = {
    perhand_pck_010: round(metric(landmarks010, ["test", "PCK"])),
    perhand_visible_pck_010: round(metric(landmarks010, ["test", "visible_PCK"])),
    perhand_pck_005: round(metric(landmarks005, ["test", "PCK"])),
    perhand_visible_pck_005: round(metric(landmarks005, ["test", "visible_PCK"])),
    clean_pck_010: round(metric(qualityAudit, ["groups", "clean", "PCK"])),
    edge_pck_010: round(metric(qualityAudit, ["groups", "edge", "PCK"])),
    oob_pck_010: round(metric(qualityAudit, ["groups", "oob", "PCK"])),
    low_contrast_pck_010: round(metric(qualityAudit, ["groups", "low_contrast", "PCK"])),
    high_error_test_crops: metric(qualityAudit, ["groups", "high_error", "samples"]),
    heatmap_candidate_pck_010: landmarkHeatmapEvidence?.metrics?.pck_010 ?? null,
    heatmap_candidate_visible_pck_010:
      landmarkHeatmapEvidence?.metrics?.visible_pck_010 ?? null,
    heatmap_candidate_pck_005: landmarkHeatmapEvidence?.metrics?.pck_005 ?? null,
    heatmap_candidate_visible_pck_005:
      landmarkHeatmapEvidence?.metrics?.visible_pck_005 ?? null,
    sourcepreserved_clean_pck_010:
      landmarkCropQualityBottleneck?.groups?.clean?.pck_010 ?? null,
    sourcepreserved_edge_pck_010:
      landmarkCropQualityBottleneck?.groups?.edge?.pck_010 ?? null,
    sourcepreserved_oob_pck_010:
      landmarkCropQualityBottleneck?.groups?.oob?.pck_010 ?? null,
    sourcepreserved_train_clean_pck_010:
      landmarkRelabelCandidateBacklog?.quality_train?.groups?.clean?.pck_010 ?? null,
    sourcepreserved_train_edge_pck_010:
      landmarkRelabelCandidateBacklog?.quality_train?.groups?.edge?.pck_010 ?? null,
    sourcepreserved_train_oob_pck_010:
      landmarkRelabelCandidateBacklog?.quality_train?.groups?.oob?.pck_010 ?? null,
    relabel_candidates_test_selected:
      landmarkRelabelCandidateBacklog?.test_candidates?.selected_candidate_count ?? null,
    relabel_candidates_train_selected:
      landmarkRelabelCandidateBacklog?.train_candidates?.selected_candidate_count ?? null,
    relabel_candidates_test_crop_rebuild_actions:
      landmarkRelabelCandidateBacklog?.test_candidates?.recommended_action_counts
        ?.rebuild_crop_with_more_context_or_mask_oob_keypoints ?? null,
    relabel_candidates_train_crop_rebuild_actions:
      landmarkRelabelCandidateBacklog?.train_candidates?.recommended_action_counts
        ?.rebuild_crop_with_more_context_or_mask_oob_keypoints ?? null,
    relabel_candidates_test_visible_pck_gte_090:
      landmarkOobMaskPolicyProbe?.test_candidates?.visible_pck_gte_090 ?? null,
    relabel_candidates_train_visible_pck_gte_090:
      landmarkOobMaskPolicyProbe?.train_candidates?.visible_pck_gte_090 ?? null,
    relabel_candidates_test_average_visible_delta:
      landmarkOobMaskPolicyProbe?.test_candidates?.average_visible_minus_all_pck_010 ?? null,
    relabel_candidates_train_average_visible_delta:
      landmarkOobMaskPolicyProbe?.train_candidates?.average_visible_minus_all_pck_010 ?? null,
    sourcepreserved_test_oob_visible_delta:
      landmarkOobMaskPolicyProbe?.quality_deltas?.test?.oob?.visible_minus_all_pck_010 ?? null,
    sourcepreserved_train_oob_visible_delta:
      landmarkOobMaskPolicyProbe?.quality_deltas?.train?.oob?.visible_minus_all_pck_010 ?? null,
    crop_context_test_teacher_edge_count:
      landmarkCropContextGeometryProbe?.test_candidates?.teacher_edge_count ?? null,
    crop_context_train_teacher_edge_count:
      landmarkCropContextGeometryProbe?.train_candidates?.teacher_edge_count ?? null,
    crop_context_test_source_expand_resolved_count:
      landmarkCropContextGeometryProbe?.test_candidates
        ?.source_expand_resolved_teacher_edge_count ?? null,
    crop_context_train_source_expand_resolved_count:
      landmarkCropContextGeometryProbe?.train_candidates
        ?.source_expand_resolved_teacher_edge_count ?? null,
    crop_context_test_full_frame_unresolved_count:
      landmarkCropContextGeometryProbe?.test_candidates
        ?.full_frame_relabel_crop_unresolved_teacher_edge_count ?? null,
    crop_context_train_full_frame_unresolved_count:
      landmarkCropContextGeometryProbe?.train_candidates
        ?.full_frame_relabel_crop_unresolved_teacher_edge_count ?? null,
    targeted_relabel_test_frame_edge_candidates:
      landmarkTargetedRelabelQueue?.test_candidates?.frame_edge_candidate_count ?? null,
    targeted_relabel_train_frame_edge_candidates:
      landmarkTargetedRelabelQueue?.train_candidates?.frame_edge_candidate_count ?? null,
    targeted_relabel_test_raw_video_available:
      landmarkTargetedRelabelQueue?.test_candidates?.raw_video_available_count ?? null,
    targeted_relabel_train_raw_video_available:
      landmarkTargetedRelabelQueue?.train_candidates?.raw_video_available_count ?? null,
    targeted_relabel_test_top32_frame_edge:
      landmarkTargetedRelabelQueue?.test_candidates?.manifest_prefix_frame_edge_counts?.top32
      ?? null,
    targeted_relabel_train_top32_frame_edge:
      landmarkTargetedRelabelQueue?.train_candidates?.manifest_prefix_frame_edge_counts?.top32
      ?? null,
    targeted_relabel_train_top32_processed:
      landmarkTargetedRelabelSmoke?.train_top32?.stats?.processed ?? null,
    targeted_relabel_train_top32_selected_detected:
      landmarkTargetedRelabelSmoke?.train_top32?.stats?.selected_detected ?? null,
    targeted_relabel_train_top32_written:
      landmarkTargetedRelabelSmoke?.train_top32?.stats?.written ?? null,
    targeted_relabel_train_top32_strict_write_rate:
      landmarkTargetedRelabelSmoke?.train_top32?.stats?.strict_write_rate ?? null,
    targeted_relabel_test_top32_processed:
      landmarkTargetedRelabelSmoke?.test_top32_diagnostic?.stats?.processed ?? null,
    targeted_relabel_test_top32_selected_detected:
      landmarkTargetedRelabelSmoke?.test_top32_diagnostic?.stats?.selected_detected ?? null,
    targeted_relabel_test_top32_written:
      landmarkTargetedRelabelSmoke?.test_top32_diagnostic?.stats?.written ?? null,
    targeted_relabel_test_top32_strict_write_rate:
      landmarkTargetedRelabelSmoke?.test_top32_diagnostic?.stats?.strict_write_rate ?? null,
    targeted_relabel_train_top32_selectedonly_written:
      landmarkTargetedRelabelAcceptanceDiagnostic?.train_top32_selected_only
        ?.stats?.written ?? null,
    targeted_relabel_train_top32_selectedonly_visible_median:
      landmarkTargetedRelabelAcceptanceDiagnostic?.train_top32_selected_only
        ?.selected_quality_summary?.visible_frac?.median ?? null,
    targeted_relabel_train_top32_selectedonly_oob_median:
      landmarkTargetedRelabelAcceptanceDiagnostic?.train_top32_selected_only
        ?.selected_quality_summary?.oob_points?.median ?? null,
    targeted_relabel_train_top32_selectedonly_visible050_oob_lte4:
      landmarkTargetedRelabelAcceptanceDiagnostic?.train_top32_selected_only
        ?.selected_quality_summary?.threshold_counts?.visible_050_oob_lte_4 ?? null,
    targeted_relabel_test_top32_selectedonly_written:
      landmarkTargetedRelabelAcceptanceDiagnostic?.test_top32_selected_only
        ?.stats?.written ?? null,
    targeted_relabel_test_top32_selectedonly_visible_max:
      landmarkTargetedRelabelAcceptanceDiagnostic?.test_top32_selected_only
        ?.selected_quality_summary?.visible_frac?.max ?? null,
    targeted_relabel_test_top32_selectedonly_oob_median:
      landmarkTargetedRelabelAcceptanceDiagnostic?.test_top32_selected_only
        ?.selected_quality_summary?.oob_points?.median ?? null,
    targeted_relabel_test_top32_selectedonly_visible050_oob_lte4:
      landmarkTargetedRelabelAcceptanceDiagnostic?.test_top32_selected_only
        ?.selected_quality_summary?.threshold_counts?.visible_050_oob_lte_4 ?? null,
    frame_edge_policy_selectedonly_rows:
      landmarkFrameEdgeCachePolicyDecision?.aggregate?.selected_row_count ?? null,
    frame_edge_policy_cache_eligible_moderate_rows:
      landmarkFrameEdgeCachePolicyDecision?.aggregate
        ?.cache_rebuild_eligible_moderate_count ?? null,
    frame_edge_policy_cache_eligible_strict_rows:
      landmarkFrameEdgeCachePolicyDecision?.aggregate
        ?.cache_rebuild_eligible_strict_count ?? null,
    frame_edge_policy_severe_frame_edge_oob_exclusion_rows:
      landmarkFrameEdgeCachePolicyDecision?.aggregate
        ?.severe_frame_edge_oob_exclusion_count ?? null,
    frame_edge_policy_hand_key_mismatch_exclusion_rows:
      landmarkFrameEdgeCachePolicyDecision?.aggregate
        ?.hand_key_mismatch_exclusion_count ?? null,
    frame_edge_policy_center_distance_exclusion_rows:
      landmarkFrameEdgeCachePolicyDecision?.aggregate
        ?.center_distance_exclusion_count ?? null,
    frame_edge_policy_train_top32_cache_eligible_moderate:
      landmarkFrameEdgeCachePolicyDecision?.train_top32_policy
        ?.cache_rebuild_eligible_moderate_count ?? null,
    frame_edge_policy_test_top32_cache_eligible_moderate:
      landmarkFrameEdgeCachePolicyDecision?.test_top32_policy
        ?.cache_rebuild_eligible_moderate_count ?? null,
    frame_edge_manifest_rows:
      landmarkFrameEdgeDispositionManifest?.summary?.rows ?? null,
    frame_edge_manifest_train_rows:
      landmarkFrameEdgeDispositionManifest?.splits?.train?.summary?.rows ?? null,
    frame_edge_manifest_test_rows:
      landmarkFrameEdgeDispositionManifest?.splits?.test?.summary?.rows ?? null,
    frame_edge_manifest_selected_only_probe_rows:
      landmarkFrameEdgeDispositionManifest?.summary?.selected_only_probe_rows ?? null,
    frame_edge_manifest_cache_rebuild_allowed:
      landmarkFrameEdgeDispositionManifest?.summary?.cache_rebuild_allowed ?? null,
    frame_edge_manifest_selected_only_excluded:
      landmarkFrameEdgeDispositionManifest?.summary
        ?.selected_only_excluded_from_cache_rebuild ?? null,
    frame_edge_manifest_clearer_source_review_required:
      landmarkFrameEdgeDispositionManifest?.summary
        ?.clearer_source_review_required ?? null,
    frame_edge_exclusion_seed_rows:
      landmarkFrameEdgeExclusionSeed?.summary?.rows ?? null,
    frame_edge_exclusion_seed_train_rows:
      landmarkFrameEdgeExclusionSeed?.summary?.train_rows ?? null,
    frame_edge_exclusion_seed_test_rows:
      landmarkFrameEdgeExclusionSeed?.summary?.test_rows ?? null,
    frame_edge_exclusion_seed_severe_frame_edge_oob:
      landmarkFrameEdgeExclusionSeed?.summary?.severe_frame_edge_oob ?? null,
    frame_edge_exclusion_seed_hand_key_mismatch:
      landmarkFrameEdgeExclusionSeed?.summary?.hand_key_mismatch ?? null,
    frame_edge_exclusion_seed_center_distance:
      landmarkFrameEdgeExclusionSeed?.summary?.center_distance ?? null,
    clearer_source_review_pool_rows:
      landmarkClearerSourceReviewSubset?.summary?.pool_rows ?? null,
    clearer_source_review_selected_rows:
      landmarkClearerSourceReviewSubset?.summary?.selected_rows ?? null,
    clearer_source_review_selected_train_rows:
      landmarkClearerSourceReviewSubset?.summary?.selected_train_rows ?? null,
    clearer_source_review_selected_test_rows:
      landmarkClearerSourceReviewSubset?.summary?.selected_test_rows ?? null,
    clearer_source_review_selected_unique_labels:
      landmarkClearerSourceReviewSubset?.summary?.selected_unique_labels ?? null,
    clearer_source_review_raw_video_missing:
      landmarkClearerSourceReviewSubset?.summary?.raw_video_missing ?? null,
    clearer_source_review_cache_rebuild_allowed:
      landmarkClearerSourceReviewSubset?.summary?.cache_rebuild_allowed ?? null,
    clearer_source_review_outcome_rows:
      landmarkClearerSourceReviewOutcomes?.summary?.selected_rows ?? null,
    clearer_source_review_outcome_pending_rows:
      landmarkClearerSourceReviewOutcomes?.summary?.pending_review ?? null,
    clearer_source_review_outcome_cache_safe_replacements:
      landmarkClearerSourceReviewOutcomes?.summary?.cache_safe_replacements ?? null,
    clearer_source_review_outcome_explicit_exclusions:
      landmarkClearerSourceReviewOutcomes?.summary?.explicit_exclusions ?? null,
    clearer_source_review_outcome_needs_additional_source_context:
      landmarkClearerSourceReviewOutcomes?.summary?.needs_additional_source_context ?? null,
    clearer_source_review_outcome_cache_rebuild_allowed:
      landmarkClearerSourceReviewOutcomes?.summary?.cache_rebuild_allowed ?? null,
    clearer_source_review_outcome_invalid_rows:
      landmarkClearerSourceReviewOutcomes?.validation?.invalid_rows ?? null,
    clearer_source_review_packet_rows:
      landmarkClearerSourceReviewPacket?.summary?.packet_rows ?? null,
    clearer_source_review_packet_train_rows:
      landmarkClearerSourceReviewPacket?.summary?.train_rows ?? null,
    clearer_source_review_packet_test_rows:
      landmarkClearerSourceReviewPacket?.summary?.test_rows ?? null,
    clearer_source_review_packet_source_videos_available:
      landmarkClearerSourceReviewPacket?.summary?.source_videos_available_local ?? null,
    clearer_source_review_packet_source_videos_missing:
      landmarkClearerSourceReviewPacket?.summary?.source_videos_missing_local ?? null,
    clearer_source_review_packet_raw_frames_embedded:
      landmarkClearerSourceReviewPacket?.summary?.raw_frames_embedded ?? null,
  };

  const handStateBottleneck = {
    HandProposal: {
      box: "present in detector and ranker receipts",
      score: "partial; detector candidate scores exist in the ranker path but are not canonicalized in a stable HandProposal receipt",
      crop: "partial; crop/pose ranker consumes owned per-hand landmark crop features",
      quality:
        "partial; M3JB box-quality ranking targets exist in the side-worktree ranker, and the validation-selected target ranker is the current fail-closed candidate",
    },
    HandInstance: {
      box: "present",
      landmarks21: "present as owned scratch per-hand landmark student metrics",
      visibility: "partial; visible PCK exists but per-instance visibility masks are not yet the canonical output",
      handness_or_slot:
        "partial; explicit direct/swapped slot targets exist for pair ranking, but no gate-passing stable handness/slot model exists",
      confidence: "partial; proposal/ranker scores are not normalized into instance confidence",
    },
    HandTrack: {
      id: "missing",
      landmarks: "not evaluated temporally",
      velocity: "missing for the hand-state lane",
      occlusion_state: "missing",
      stale_state: "missing",
    },
    normalization_status: {
      crop_xy: "partial",
      full_frame_xy: "partial",
      wrist_palm_relative_xy: "missing",
      mirrored_hand_canonical_pose: "missing",
      visibility_masks: "partial",
      uncertainty: "missing",
      box_quality: "partial",
      velocity: "missing",
    },
  };

  const gates = {
    boxes: {
      status: gateResult(currentPairSelected.distinct_assigned_coverage, ">=", 0.98)
        && gateResult(currentPairSelected.coverage, ">=", 0.98)
        && gateResult(currentPairSelected.collapse_rate, "<=", 0.02)
        ? "passed"
        : "failed_open",
      metrics: {
        recall_iou_030_proxy: proposalMetrics.current_pair_ranker_coverage,
        distinct_two_hand_assignment: proposalMetrics.current_pair_ranker_distinct_assigned_coverage,
        duplicate_collapse: proposalMetrics.current_pair_ranker_collapse_rate,
        heuristic_top2nms_coverage: proposalMetrics.heuristic_top2nms_coverage,
        heuristic_top2nms_distinct_assignment:
          proposalMetrics.heuristic_top2nms_distinct_assigned_coverage,
        heuristic_top2nms_collapse: proposalMetrics.heuristic_top2nms_collapse_rate,
        heuristic_top2nms_decoded_two_distinct:
          proposalMetrics.heuristic_top2nms_decoded_two_distinct,
        deterministic_postfilter_named_ceiling_coverage:
          proposalMetrics.deterministic_postfilter_named_ceiling_coverage,
        deterministic_postfilter_named_ceiling_distinct_assignment:
          proposalMetrics.deterministic_postfilter_named_ceiling_distinct_assigned_coverage,
        top20_oracle_distinct_assignment: proposalMetrics.top20_oracle_distinct_assigned_coverage,
        wider_candidate_oracle_distinct_assignment:
          proposalMetrics.wider_candidate_oracle_distinct_assigned_coverage,
        focused_sliver_oracle_aug64_distinct_assignment:
          proposalMetrics.focusedsliver_oracle_aug64_real_twohand_distinct_assigned_coverage,
        focused_sliver_directpair_aug64_distinct_assignment:
          proposalMetrics.focusedsliver_directpair_aug64_full_brev_real_twohand_distinct_assigned_coverage,
      },
      criteria: {
        recall_iou_030: ">= 0.98",
        recall_iou_050: ">= 0.90 (not available in current receipt)",
        false_no_hand: "<= 0.02 (not available in current receipt)",
        hard_negative_false_trigger: "<= 0.05 (not available in current receipt)",
        duplicate_collapse: "<= 0.02",
        distinct_two_hand_assignment: ">= 0.98",
      },
      current_product_proxy: currentVsFutureBoxGateSplit?.current_product_box_proxy ?? null,
      future_tracker_slot_contract:
        currentVsFutureBoxGateSplit?.future_tracker_slot_contract ?? null,
    },
    landmarks: {
      status: gateResult(landmarkMetrics.perhand_pck_010, ">=", 0.9)
        && gateResult(landmarkMetrics.perhand_pck_005, ">=", 0.75)
        ? "passed"
        : "failed_open",
      metrics: landmarkMetrics,
      criteria: {
        pck_010: ">= 0.90",
        pck_005: ">= 0.75",
        topology_flips: "not yet receipt-proven",
        browser_mapping: "not yet receipt-proven",
      },
    },
    tracking: {
      status: "not_evaluated",
      metrics: {
        swap_rate: null,
        dual_track_collapse: null,
        confident_stale_boxes: null,
      },
      criteria: {
        swap_rate: "<= 0.02",
        dual_track_collapse: "0 sustained failures",
        confident_stale_boxes: "0 sustained failures",
      },
    },
  };

  const result = {
    schema_version: "asl-pilot-m3jb-hand-state-tracker-audit/v1",
    receipt_id: "return-to-form-m3jb-hierarchical-hand-state-tracker-v1",
    mission: "M3JB - Hierarchical hand-state tracker",
    status: blockers.length === 0 ? "passed_fail_closed_not_gate_passing" : "failed_missing_required_evidence",
    checked_at: new Date().toISOString(),
    active_prompt: activePrompt,
    runtime_boundary: {
      mediapipe_runtime_dependency_allowed: false,
      offline_mediapipe_teacher_allowed: true,
      raw_learner_video_upload_allowed: false,
      browser_artifacts_default_off_until_gates_pass: true,
      detector0_promoted: false,
    },
    checks,
    blockers,
    artifacts: [
      artifactRecord(goalPath, "Master loop prompt recording the current M3JB research-guided landmark PCK campaign and selected next action."),
      artifactRecord(promptPath, "Active M3JB prompt defining the hand-state hierarchy and gates."),
      artifactRecord(
        architectureFilePath,
        "Architecture GPU execution policy, including Brev routing and no artificial local-runtime downscoping.",
      ),
      artifactRecord(
        computePolicyReceiptFilePath,
        "Accepted M3JB Brev compute authorization and no-artificial-downsize policy receipt.",
      ),
      artifactRecord(
        sideReceipts.detectorDistinct,
        "Detector receipt with old baseline plus top-2 objectness + NMS heuristic baseline over 84 real two-hand rows.",
      ),
      artifactRecord(
        webPreviewEvidence.browserModelBundle,
        "Sibling web preview browser-model bundle proving current recognition, Detector0 tracking, and box-driven avatar gates are disabled.",
      ),
      artifactRecord(
        webPreviewEvidence.practiceApp,
        "Sibling web preview practice screen showing current pass/fail consumes raw frame samples and the browser inference engine, not Detector0 hand slots.",
      ),
      artifactRecord(
        webPreviewEvidence.passFailDecision,
        "Sibling web preview pass/fail decision module showing current recognizer decisions are based on model status, active labels, frame quality, and raw-frame inference output.",
      ),
      artifactRecord(
        webPreviewEvidence.liveTracker,
        "Sibling web preview live tracker showing preview hand slots are anonymous hand_0/hand_1 tracks with duplicate suppression, not anatomical L/R pass/fail inputs.",
      ),
      artifactRecord(
        webPreviewEvidence.lessonApp,
        "Sibling web preview lesson screen marking live skeleton tracking as experimental demonstration only and not a pass/fail gate.",
      ),
      artifactRecord(sideReceipts.pairRankerCropPose, "Best current crop/pose-aware pair-ranker receipt."),
      artifactRecord(sideReceipts.perHandLandmarksPck010, "Current selected owned per-hand landmark PCK@0.10 receipt."),
      artifactRecord(sideReceipts.perHandLandmarksPck005, "Current selected owned per-hand landmark PCK@0.05 receipt."),
      artifactRecord(sideReceipts.perHandQualityAudit, "Per-hand crop quality audit for edge/OOB/low-texture failures."),
      artifactRecord(
        sideReceipts.landmarkHeatmapTrainerCode,
        "Scratch heatmap/soft-argmax landmark trainer; no pretrained runtime dependency.",
      ),
      artifactRecord(
        sideReceipts.landmarkHeatmapBestPck010,
        "Best current heatmap-head landmark candidate at PCK@0.10; diagnostic, not gate-passing.",
      ),
      artifactRecord(
        sideReceipts.landmarkHeatmapBestPck005,
        "Best current heatmap-head landmark candidate evaluated at PCK@0.05; diagnostic, not gate-passing.",
      ),
      artifactRecord(
        sideReceipts.sourcePreservedCropQualityAudit,
        "Source-preserved per-hand crop quality audit exposing edge/OOB/high-error landmark bottlenecks.",
      ),
      artifactRecord(
        sideReceipts.sourcePreservedCropQualityAuditTrain,
        "Train-split source-preserved per-hand crop quality audit for crop/relabel policy comparison.",
      ),
      artifactRecord(
        sideReceipts.sourcePreservedRelabelCandidatesTest,
        "Fixed test-split source-preserved relabel/crop-policy candidate backlog; diagnostic only.",
      ),
      artifactRecord(
        sideReceipts.sourcePreservedRelabelCandidatesTrain,
        "Fixed train-split source-preserved relabel/crop-policy candidate backlog for local policy probes.",
      ),
      artifactRecord(
        sideReceipts.targetedRelabelCandidatesScript,
        "Offline-only targeted relabel tool for rerunning teacher labels on source-linked crop-quality candidates.",
      ),
      artifactRecord(
        sideReceipts.targetedRelabelTrainTop32Rows,
        "Bounded train top-32 targeted relabel smoke rows/stats for true frame-edge/OOB candidates; offline teacher evidence only.",
      ),
      artifactRecord(
        sideReceipts.targetedRelabelTestTop32Rows,
        "Bounded diagnostic test top-32 targeted relabel smoke rows/stats for true frame-edge/OOB candidates; offline teacher evidence only.",
      ),
      artifactRecord(
        sideReceipts.targetedRelabelTrainTop32SelectedOnlyRows,
        "Selected-only train top-32 targeted relabel diagnostic rows/stats used to inspect visibility and OOB quality after strict acceptance failed.",
      ),
      artifactRecord(
        sideReceipts.targetedRelabelTestTop32SelectedOnlyRows,
        "Selected-only diagnostic test top-32 targeted relabel rows/stats used to inspect visibility and OOB quality after strict acceptance failed.",
      ),
      artifactRecord(
        frameEdgeDispositionManifestFilePath,
        "Main-repo full frame-edge/OOB disposition manifest for train/test backlog rows; keeps unsafe rows out of landmark cache rebuild.",
      ),
      artifactRecord(
        frameEdgeExclusionSeedFilePath,
        "Main-repo cache exclusion seed for selected-only frame-edge/OOB rows committed out of landmark cache rebuild.",
      ),
      artifactRecord(
        clearerSourceReviewSubsetFilePath,
        "Main-repo source-linked clearer-source review subset for unprobed frame-edge/OOB rows; does not authorize cache rebuild.",
      ),
      generatedJsonArtifactRecord(
        clearerSourceReviewOutcomesFilePath,
        landmarkClearerSourceReviewOutcomes,
        "Main-repo fail-closed reviewer outcome ledger for the clearer-source subset; pending rows do not authorize cache rebuild.",
      ),
      generatedJsonArtifactRecord(
        clearerSourceReviewPacketFilePath,
        landmarkClearerSourceReviewPacket,
        "Metadata-only local reviewer packet for the first pending clearer-source rows; contains no embedded frames and does not authorize cache rebuild.",
      ),
      artifactRecord(
        landmarkCacheRebuildEvalReceiptFilePath,
        "Main-repo cache rebuild and eval-only PCK receipt for the batch-finished clearer-source exclusion policy; not gate-passing and not a training run.",
      ),
      artifactRecord(
        landmarkRetrainBrevPlanReceiptFilePath,
        "Main-repo approved Brev launch plan for full scratch landmark retraining on the rebuilt cache; now records the consumed completed run outcome as rejected fail-closed.",
      ),
      artifactRecord(
        landmarkRetrainBrevRunReceiptFilePath,
        "Main-repo run receipt for the consumed approved Brev scratch landmark retrain; records copied artifacts, failed metrics, and stopped worker.",
      ),
      artifactRecord(
        landmarkRetrainRegressionPivotReceiptFilePath,
        "Main-repo local no-Brev regression analysis receipt selecting the resolution/capacity pivot after the rejected landmark retrain.",
      ),
      artifactRecord(
        landmarkPckCampaignResearchPlanReceiptFilePath,
        "Main-repo campaign research-plan receipt recording the GPT-Pro fallback, selected w96/g48 full-train first experiment, and no Brev/training in this setup slice.",
      ),
      artifactRecord(
        landmarkRetrainLocalPreflightReceiptFilePath,
        "Main-repo local preflight receipt for the approval-gated landmark retrain plan; validates trainer/cache readiness without Brev or training.",
      ),
      artifactRecord(
        brevReadinessRefreshReceiptFilePath,
        "Main-repo read-only Brev readiness refresh receipt; records retained worker visibility from before approval was recorded.",
      ),
      artifactRecord(
        brevApprovalRequestReceiptFilePath,
        "Main-repo human approval receipt for the landmark retrain plan; records exact current-thread approval text, consumed launch outcome, and local pivot next action.",
      ),
      artifactRecord(
        brevApprovalBlockerReceiptFilePath,
        "Main-repo approval-blocker receipt preserving the prior missing-approval history and the completed rejected launch resolution.",
      ),
      artifactRecord(
        codexSupervisorDryRunReceiptFilePath,
        "Main-repo Codex supervisor launch dry-run receipt; validates local-skills supervisor command without starting the loop.",
      ),
      artifactRecord(
        codexBothDryRunReceiptFilePath,
        "Main-repo Codex both-role launch dry-run receipt; validates local-skills executor and observer commands without starting either loop.",
      ),
      artifactRecord(sideReceipts.pairRankerCode, "Side-worktree pair ranker with M3JB handness/slot, box-quality, and hard-negative target support."),
      artifactRecord(sideReceipts.pairRankerTargetsTop20, "Bounded target-weighted top-20 pair-ranker probe receipt; diagnostic, not selected."),
      artifactRecord(
        sideReceipts.pairRankerTargetsValSelect,
        "Validation-selected target-weighted top-20 pair-ranker receipt; current fail-closed candidate.",
      ),
      artifactRecord(
        sideReceipts.pairRankerTargetsValSelectWeights,
        "Validation-selected target-weighted top-20 pair-ranker weights; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.candidateOracleSweep,
        "Strict oracle-only candidate-generation sweep over wider top-K and NMS settings; no training or promotion.",
      ),
      artifactRecord(
        sideReceipts.candidateRepairTargets,
        "Eval-only hard-target manifest for real two-hand frames still missed by the current-head top-40/NMS0.5 oracle.",
      ),
      artifactRecord(
        sideReceipts.candidateRepairContactSheet,
        "Contact sheet for the current-head proposal repair hard targets; diagnostic only.",
      ),
      artifactRecord(
        sideReceipts.candidateNoLeakAnalogs,
        "Eval-only train/validation near-miss analog manifest for no-leak proposal-head repair planning.",
      ),
      artifactRecord(
        sideReceipts.candidateNoLeakAnalogsContactSheet,
        "Contact sheet for no-leak train/validation proposal near-miss analogs; diagnostic only.",
      ),
      artifactRecord(
        sideReceipts.candidateNoLeakAnalogsT065,
        "Expanded eval-only no-leak train/validation near-miss analog manifest at min-best IoU <= 0.65.",
      ),
      artifactRecord(
        sideReceipts.candidateNoLeakAnalogsT065ContactSheet,
        "Contact sheet for expanded no-leak train/validation near-miss analogs; diagnostic only.",
      ),
      artifactRecord(
        sideReceipts.proposalTrainAnalogProbe,
        "Bounded local proposal-head continuation using one train analog; rejected because validation-selected state did not improve.",
      ),
      artifactRecord(
        sideReceipts.proposalTrainAnalogWeights,
        "Weights emitted by rejected train-analog probe; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.proposalTrainAnalogRender,
        "Render from rejected train-analog proposal-head probe.",
      ),
      artifactRecord(
        sideReceipts.proposalTrainAnalogFailures,
        "Failure contact sheet from rejected train-analog proposal-head probe.",
      ),
      artifactRecord(
        sideReceipts.proposalTrainAnalogT065Probe,
        "Bounded local proposal-head continuation using seven expanded train analogs; rejected because validation-selected state did not improve.",
      ),
      artifactRecord(
        sideReceipts.proposalTrainAnalogT065Weights,
        "Weights emitted by rejected expanded-analog proposal-head probe; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.proposalTrainAnalogT065Render,
        "Render from rejected expanded-analog proposal-head probe.",
      ),
      artifactRecord(
        sideReceipts.proposalTrainAnalogT065Failures,
        "Failure contact sheet from rejected expanded-analog proposal-head probe.",
      ),
      artifactRecord(
        sideReceipts.subproposalOracle,
        "Eval-only deterministic subproposal oracle proving a broader second-stage proposal head can recover most remaining current-head misses.",
      ),
      artifactRecord(
        sideReceipts.subproposalRankerSmoke,
        "Tiny train/eval smoke proving the trainable subproposal-candidate ranker path writes receipts and weights.",
      ),
      artifactRecord(
        sideReceipts.subproposalRankerGeom,
        "Bounded trainable geometry-only subproposal ranker probe; rejected because it did not approach the oracle and introduced collapse.",
      ),
      artifactRecord(
        sideReceipts.subproposalRankerGeomWeights,
        "Weights emitted by rejected geometry-only subproposal ranker probe; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.subproposalRankerCropPoseSmoke,
        "Tiny train/eval smoke proving crop/pose features can be extracted for augmented subproposal candidates.",
      ),
      artifactRecord(
        sideReceipts.subproposalRankerCropPose,
        "Bounded trainable crop/pose subproposal ranker probe; rejected because it still selected collapsed or wrong pairs.",
      ),
      artifactRecord(
        sideReceipts.subproposalRankerCropPoseWeights,
        "Weights emitted by rejected crop/pose subproposal ranker probe; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadCropPoseSmoke,
        "Tiny train/eval smoke proving the candidate-level subproposal head writes receipts and weights.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadCropPose,
        "Bounded trainable crop/pose candidate-level subproposal head probe; rejected because real selection remains far below gate.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadCropPoseWeights,
        "Weights emitted by rejected candidate-level subproposal head probe; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.candidateSelectionFailureAudit,
        "Eval-only failure taxonomy for the rejected candidate-level selector on real two-hand rows.",
      ),
      artifactRecord(
        sideReceipts.candidateSelectionFailureContactSheet,
        "Contact sheet visualizing top candidate selector failures with GT, selected, and oracle boxes.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairRankSmoke,
        "Tiny local smoke for the pair-rank calibrated candidate-head objective; diagnostic only, not gate evidence.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairRankSmokeWeights,
        "Weights emitted by the pair-rank candidate-head smoke; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairRankFullBrev,
        "Uncapped full-scope Brev run for the pair-rank calibrated candidate-head objective; rejected because real two-hand distinct assignment remains below gate.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairRankFullBrevWeights,
        "Weights emitted by the rejected uncapped full-scope Brev pair-rank candidate-head run; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairRankFullBrevFailureAudit,
        "Eval-only failure taxonomy for the rejected uncapped pair-rank Brev selector on real two-hand rows.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairRankFullBrevFailureContactSheet,
        "Contact sheet visualizing the rejected uncapped pair-rank Brev selector failures.",
      ),
      artifactRecord(
        pairRankObjectiveReceiptFilePath,
        "Pair-rank selector objective smoke receipt plus recovered-worker uncapped Brev run and final fail-closed selector status.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairMarginSmoke,
        "Tiny local smoke for the pair-margin candidate-head selector repair; diagnostic only, not gate evidence.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairMarginSmokeWeights,
        "Weights emitted by the pair-margin candidate-head smoke; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairMarginFullBrev,
        "Uncapped full-scope Brev run for the pair-margin candidate-head selector repair; rejected because distinct assignment did not improve.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairMarginFullBrevWeights,
        "Weights emitted by the rejected pair-margin full-scope Brev run; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairMarginFullBrevFailureAudit,
        "Eval-only failure taxonomy for the rejected pair-margin Brev selector on real two-hand rows.",
      ),
      artifactRecord(
        sideReceipts.candidateHeadPairMarginFullBrevFailureContactSheet,
        "Contact sheet visualizing the rejected pair-margin Brev selector failures.",
      ),
      artifactRecord(
        pairMarginSelectorRepairReceiptFilePath,
        "Pair-margin selector repair receipt recording smoke, uncapped Brev run, failure audit, and rejection.",
      ),
      artifactRecord(
        sideReceipts.directPairScorerSmoke,
        "Tiny local smoke for the direct pair-scorer path; diagnostic only, not gate evidence.",
      ),
      artifactRecord(
        sideReceipts.directPairScorerSmokeWeights,
        "Weights emitted by the direct pair-scorer smoke; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.directPairScorerFullBrev,
        "Uncapped full-scope Brev run for the direct pair scorer; rejected because real two-hand distinct assignment remains below gate.",
      ),
      artifactRecord(
        sideReceipts.directPairScorerFullBrevWeights,
        "Weights emitted by the rejected uncapped full-scope Brev direct pair-scorer run; not promoted to browser runtime.",
      ),
      artifactRecord(
        directPairScorerReceiptFilePath,
        "Direct pair-scorer smoke, provider recovery, uncapped Brev run, and fail-closed rejection receipt.",
      ),
      artifactRecord(
        sideReceipts.assignmentHeadFullBrev,
        "Uncapped full-scope Brev run for the overlap-aware assignment head with assignment evidence added to pair scores; rejected because it regressed real two-hand selection.",
      ),
      artifactRecord(
        sideReceipts.assignmentHeadFullBrevWeights,
        "Weights emitted by the rejected assignment-head score+loss Brev run; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.assignmentHeadLossOnlyFullBrev,
        "Uncapped full-scope Brev run for the overlap-aware assignment head as loss-only auxiliary supervision; rejected because it did not beat the direct pair scorer.",
      ),
      artifactRecord(
        sideReceipts.assignmentHeadLossOnlyFullBrevWeights,
        "Weights emitted by the rejected assignment-head loss-only Brev run; not promoted to browser runtime.",
      ),
      artifactRecord(
        assignmentHeadRepairReceiptFilePath,
        "Overlap-aware assignment-head repair receipt recording local smoke, two uncapped Brev variants, rejection, copyback, and cleanup.",
      ),
      artifactRecord(
        sideReceipts.focusedSliverSubproposalOracleAug24,
        "Eval-only focused-sliver subproposal oracle at aug24; diagnostic because oracle distinct stays below the perfect aug64 ceiling.",
      ),
      artifactRecord(
        sideReceipts.focusedSliverSubproposalOracleAug64,
        "Eval-only focused-sliver subproposal oracle at aug64; recovers the tiny-hand and coverage rows and reaches perfect real two-hand oracle.",
      ),
      artifactRecord(
        sideReceipts.focusedSliverSubproposalOracleAug160,
        "Eval-only focused-sliver subproposal oracle at aug160; confirms the perfect real two-hand oracle also holds at a larger candidate budget.",
      ),
      artifactRecord(
        sideReceipts.focusedSliverDirectPairFullBrev,
        "Uncapped full-scope Brev run for direct pair scoring over focused-sliver aug64 candidates; rejected because selected real two-hand assignment regressed while oracle is perfect.",
      ),
      artifactRecord(
        sideReceipts.focusedSliverDirectPairFullBrevWeights,
        "Weights emitted by the rejected focused-sliver aug64 direct pair-scorer Brev run; not promoted to browser runtime.",
      ),
      artifactRecord(
        focusedSliverRepairReceiptFilePath,
        "Focused-sliver subproposal repair receipt recording oracle recovery, full-scope Brev run, rejection, copyback, and cleanup caveat.",
      ),
      artifactRecord(
        sideReceipts.focusedSliverDirectPairCalibrationAudit,
        "Eval-only pair-ranker calibration audit over the rejected focused-sliver aug64 selector.",
      ),
      artifactRecord(
        sideReceipts.focusedSliverDirectPairCalibrationContactSheet,
        "Contact sheet visualizing focused-sliver aug64 pair-ranker calibration failures.",
      ),
      artifactRecord(
        pairRankerCalibrationAuditReceiptFilePath,
        "Main-repo pair-ranker calibration audit receipt recording selected-vs-oracle logit rank failure.",
      ),
      artifactRecord(
        sideReceipts.directPairMarginSmoke,
        "Tiny local smoke for the direct pair-ranker hard-negative margin objective over focused-sliver candidates; diagnostic only, not gate evidence.",
      ),
      artifactRecord(
        sideReceipts.directPairMarginSmokeWeights,
        "Weights emitted by the direct pair-margin smoke; not promoted to browser runtime.",
      ),
      artifactRecord(
        directPairMarginObjectiveReceiptFilePath,
        "Direct pair-ranker margin-objective implementation and smoke receipt; records Brev auth blocker for the uncapped run.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun1,
        "Brev run1 w96/heatmap48 full-train scratch per-hand landmark receipt; clear PCK win but still below gate.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun1Weights,
        "Weights emitted by the run1 w96/heatmap48 scratch per-hand landmark experiment; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun1EvalPck010,
        "Eval-only PCK@0.10 receipt for run1 w96/heatmap48 copied back from Brev.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun1EvalPck005,
        "Eval-only PCK@0.05 receipt for run1 w96/heatmap48 copied back from Brev.",
      ),
      artifactRecord(
        landmarkPckCampaignRun1ReceiptFilePath,
        "Main-repo run1 receipt recording command, metrics, copyback, teardown, and next run selection.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun2,
        "Brev run2 w128/heatmap64 full-train scratch per-hand landmark receipt; clear PCK win but still below gate.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun2Weights,
        "Weights emitted by the run2 w128/heatmap64 scratch per-hand landmark experiment; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun2EvalPck010,
        "Eval-only PCK@0.10 receipt for run2 w128/heatmap64 copied back from Brev.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun2EvalPck005,
        "Eval-only PCK@0.05 receipt for run2 w128/heatmap64 copied back from Brev.",
      ),
      artifactRecord(
        landmarkPckCampaignRun2ReceiptFilePath,
        "Main-repo run2 receipt recording command, metrics, copyback, teardown, and next run selection.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun3,
        "Brev run3 w128/heatmap64 hard-geometry augmentation scratch per-hand landmark receipt; no clear PCK win and still below gate.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun3Weights,
        "Weights emitted by the run3 hard-geometry augmentation scratch per-hand landmark experiment; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun3EvalPck010,
        "Eval-only PCK@0.10 receipt for run3 hard-geometry augmentation copied back from Brev.",
      ),
      artifactRecord(
        sideReceipts.landmarkPckCampaignRun3EvalPck005,
        "Eval-only PCK@0.05 receipt for run3 hard-geometry augmentation copied back from Brev.",
      ),
      artifactRecord(
        landmarkPckCampaignRun3ReceiptFilePath,
        "Main-repo run3 receipt recording no-clear-win metrics, copyback, teardown, and no-Brev research-refresh next action.",
      ),
      artifactRecord(
        path.join(root, landmarkPckResearchRefreshAfterRun3PromptPath),
        "Post-run3 research-refresh prompt sent through the prompt-authorized research route.",
      ),
      artifactRecord(
        path.join(root, landmarkPckResearchRefreshAfterRun3RequestPath),
        "OpenAI API request JSON for the post-run3 research refresh.",
      ),
      artifactRecord(
        path.join(root, landmarkPckResearchRefreshAfterRun3RawPath),
        "Raw OpenAI API response for the post-run3 research refresh.",
      ),
      artifactRecord(
        path.join(root, landmarkPckResearchRefreshAfterRun3ResponsePath),
        "Extracted advisory memo selecting scratch residual heatmap architecture preflight before any further paid run.",
      ),
      artifactRecord(
        landmarkPckResearchRefreshAfterRun3ReceiptFilePath,
        "Main-repo post-run3 research-refresh receipt selecting the local-only ResUNet/hourglass architecture preflight and preserving the no-Brev boundary.",
      ),
      artifactRecord(
        sidePerHandLandmarkTrainerPath,
        "Side-worktree per-hand landmark trainer with the scratch ResUNet/hourglass architecture option committed for review before run4.",
      ),
      artifactRecord(
        sidePerHandResunetArchitectureSmokePath,
        "Side-worktree CPU architecture smoke proving the ResUNet/hourglass forward/loss/decode/eval path without training or checkpoint output.",
      ),
      artifactRecord(
        landmarkPckResunetArchitecturePreflightReceiptFilePath,
        "Main-repo local ResUNet/hourglass architecture preflight receipt recording side code hash, smoke hash, and exact run4 Brev envelope.",
      ),
      artifactRecord(
        sideRecognizerTrainerPath,
        "Side-worktree recognizer trainer with fixed-default scheduler flags and receipt LR trace support.",
      ),
      artifactRecord(
        sideRecognizerDiagnosticsTestPath,
        "Side-worktree recognizer diagnostics test covering fixed-LR default and cosine warmup/decay endpoints.",
      ),
      artifactRecord(
        recognizerSchedulerTinyOverfitReceiptFilePath,
        "Local no-save tiny Transformer overfit receipt proving the scheduler path still reaches train top-1 1.0.",
      ),
      artifactRecord(
        recognizerSchedulerFullDataSmokeReceiptFilePath,
        "Local no-save full-data one-epoch scheduler smoke proving uncapped counts and scheduler receipt fields.",
      ),
      artifactRecord(
        recognizerSchedulerPreflightReceiptFilePath,
        "Main-repo recognizer scheduler preflight receipt selecting the run3 scheduler fulltrain token.",
      ),
      artifactRecord(
        sideRecognizerRun3SchedulerReceiptPath,
        "Ignored side-worktree run3 scheduler fulltrain JSON copied back from Brev; hash is recorded by the main receipt.",
      ),
      artifactRecord(
        sideRecognizerRun3SchedulerWeightsPath,
        "Ignored side-worktree run3 scheduler fulltrain checkpoint copied back from Brev; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideRecognizerRun3SchedulerLogPath,
        "Ignored side-worktree run3 scheduler fulltrain log copied back from Brev.",
      ),
      artifactRecord(
        recognizerRun3SchedulerFulltrainReceiptFilePath,
        "Main-repo recognizer run3 scheduler fulltrain receipt recording metrics, copied hashes, teardown, and fail-closed next action.",
      ),
      artifactRecord(
        recognizerRun3ResearchTuningPromptFilePath,
        "Run3 recognizer research tuning prompt sent through the prompt-authorized research route.",
      ),
      artifactRecord(
        recognizerRun3ResearchTuningRequestFilePath,
        "OpenAI API request JSON for run3 recognizer research tuning.",
      ),
      artifactRecord(
        recognizerRun3ResearchTuningRawFilePath,
        "Raw OpenAI API response for run3 recognizer research tuning.",
      ),
      artifactRecord(
        recognizerRun3ResearchTuningResponseFilePath,
        "Complete gpt-5.5 research memo selecting T=32 cache/loader preflight before run4.",
      ),
      artifactRecord(
        recognizerRun3ResearchTuningReceiptFilePath,
        "Main-repo run3 recognizer research tuning receipt selecting the local/no-Brev T=32 cache/loader preflight.",
      ),
      artifactRecord(
        recognizerT32LoaderDryrunReceiptFilePath,
        "Focused local recognizer loader dry-run receipt: current T=20 cache, one no-grad Transformer forward/loss batch, zero optimizer steps, and no checkpoint.",
      ),
      artifactRecord(
        recognizerT32CacheLoaderPreflightReceiptFilePath,
        "Main-repo recognizer T=32 cache loader preflight receipt recording seq-len guard support and selecting local cache materialization next.",
      ),
      artifactRecord(
        sideRecognizerT32SmokeRowsPath,
        "Ignored side-worktree T=32 recognizer smoke cache rows: clips-per-word 1 across train/validation/test, all 95 labels, 32 frames per clip.",
      ),
      artifactRecord(
        recognizerT32CacheSmokeDryrunReceiptFilePath,
        "Focused local T=32 smoke-cache recognizer dry-run receipt: one no-grad Transformer forward/loss batch, zero optimizer steps, no checkpoint.",
      ),
      artifactRecord(
        recognizerT32CacheSmokeValidateReceiptFilePath,
        "Main-repo recognizer T=32 smoke-cache validation receipt selecting full-cache materialization next.",
      ),
      artifactRecord(
        sideRecognizerT32FullRowsPath,
        "Ignored side-worktree full T=32 recognizer cache rows: PopSign plus ASL Citizen, w64 landmark model, run4 prerequisite cache.",
      ),
      artifactRecord(
        recognizerT32FullCacheDryrunReceiptFilePath,
        "Focused local full T=32 recognizer dry-run receipt: one no-grad Transformer forward/loss batch, zero optimizer steps, no checkpoint.",
      ),
      artifactRecord(
        recognizerT32FullCacheValidateReceiptFilePath,
        "Main-repo recognizer full T=32 cache validation receipt selecting run4 T=32 Brev training next.",
      ),
      artifactRecord(
        recognizerRun4T32PreflightBlockerReceiptFilePath,
        "Main-repo recognizer run4 T=32 Brev preflight blocker receipt recording SSH timeout, no remote sync/training, and stopped/unhealthy worker teardown.",
      ),
      artifactRecord(
        recognizerRun4T32HealthRefreshReceiptFilePath,
        "Main-repo recognizer run4 T=32 read-only Brev health refresh receipt recording no healthy existing L40S worker and no spend.",
      ),
      artifactRecord(
        sideRecognizerRun4T32PretrainDryrunPath,
        "Ignored side-worktree run4 T=32 CUDA dry-run receipt copied back from Brev; zero optimizer steps and no checkpoint.",
      ),
      artifactRecord(
        sideRecognizerRun4T32FulltrainReceiptPath,
        "Ignored side-worktree run4 T=32 fulltrain JSON copied back from Brev; hash is recorded by the main receipt.",
      ),
      artifactRecord(
        sideRecognizerRun4T32FulltrainWeightsPath,
        "Ignored side-worktree run4 T=32 fulltrain checkpoint copied back from Brev; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideRecognizerRun4T32FulltrainLogPath,
        "Ignored side-worktree run4 T=32 fulltrain log copied back from Brev.",
      ),
      artifactRecord(
        recognizerRun4T32FulltrainReceiptFilePath,
        "Main-repo recognizer run4 T=32 fulltrain receipt recording improved fail-closed metrics, copied hashes, teardown, and no-Brev research-tuning next action.",
      ),
      artifactRecord(
        recognizerRun4ResearchTuningPromptFilePath,
        "Run4 recognizer research prompt asking for exactly one next no-Brev preflight and one paid run5 recipe.",
      ),
      artifactRecord(
        recognizerRun4ResearchTuningRequestFilePath,
        "OpenAI Responses API request for run4 recognizer research tuning.",
      ),
      artifactRecord(
        recognizerRun4ResearchTuningRawFilePath,
        "Raw gpt-5.5 API response for run4 recognizer research tuning.",
      ),
      artifactRecord(
        recognizerRun4ResearchTuningResponseFilePath,
        "Complete gpt-5.5 research memo selecting supervised-contrastive auxiliary-loss preflight before run5.",
      ),
      artifactRecord(
        recognizerRun4ResearchTuningReceiptFilePath,
        "Main-repo run4 recognizer research tuning receipt selecting the local/no-Brev supervised-contrastive preflight.",
      ),
      artifactRecord(
        sideRecognizerTransformerPath,
        "Side-worktree Transformer recognizer student with optional normalized CLS embedding return for training-only diagnostics.",
      ),
      artifactRecord(
        sideRecognizerTrainerPath,
        "Side-worktree recognizer trainer with disabled-by-default supervised-contrastive auxiliary loss support.",
      ),
      artifactRecord(
        sideRecognizerDiagnosticsTestPath,
        "Side-worktree recognizer diagnostics tests covering SupCon positive-anchor/no-positive behavior and weight-zero CE/KD preservation.",
      ),
      artifactRecord(
        recognizerRun5SupconZeroWeightDryrunReceiptFilePath,
        "Focused local run5 zero-weight dry-run receipt proving the CE/KD path remains unchanged with zero optimizer steps and no checkpoint.",
      ),
      artifactRecord(
        recognizerRun5SupconWeight005DryrunReceiptFilePath,
        "Focused local run5 weighted SupCon dry-run receipt recording finite CE/KD/SupCon components, positive anchors, zero optimizer steps, and no checkpoint.",
      ),
      artifactRecord(
        recognizerRun5SupconPreflightReceiptFilePath,
        "Main-repo run5 SupCon preflight receipt selecting the full T=32 CUDA run5 envelope.",
      ),
      artifactRecord(
        sideRecognizerRun5SupconPretrainDryrunPath,
        "Ignored side-worktree run5 SupCon CUDA dry-run receipt copied back from Brev; zero optimizer steps and no checkpoint.",
      ),
      artifactRecord(
        sideRecognizerRun5SupconFulltrainReceiptPath,
        "Ignored side-worktree run5 SupCon fulltrain JSON copied back from Brev; hash is recorded by the main receipt.",
      ),
      artifactRecord(
        sideRecognizerRun5SupconFulltrainWeightsPath,
        "Ignored side-worktree run5 SupCon fulltrain checkpoint copied back from Brev; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideRecognizerRun5SupconFulltrainLogPath,
        "Ignored side-worktree run5 SupCon fulltrain log copied back from Brev.",
      ),
      artifactRecord(
        recognizerRun5SupconFulltrainReceiptFilePath,
        "Main-repo recognizer run5 SupCon fulltrain receipt recording fail-closed metrics, copied hashes, teardown, and no-Brev research-tuning next action.",
      ),
      artifactRecord(
        recognizerRun5ResearchTuningPromptFilePath,
        "Run5 recognizer research prompt asking why SupCon improved classification but not recall@FAR10 and requesting exactly one next no-Brev slice plus one gated run6 recipe.",
      ),
      artifactRecord(
        recognizerRun5ResearchTuningRequestFilePath,
        "OpenAI Responses API request for run5 recognizer research tuning.",
      ),
      artifactRecord(
        recognizerRun5ResearchTuningRawFilePath,
        "Raw gpt-5.5 API response for run5 recognizer research tuning.",
      ),
      artifactRecord(
        recognizerRun5ResearchTuningResponseFilePath,
        "Complete gpt-5.5 research memo selecting verification-margin diagnostics and monitor verification-recall checkpoint-selection preflight before run6.",
      ),
      artifactRecord(
        recognizerRun5ResearchTuningReceiptFilePath,
        "Main-repo run5 recognizer research tuning receipt selecting the local/no-Brev verification-margin and selection preflight.",
      ),
      artifactRecord(
        sideRecognizerVerificationPath,
        "Side-worktree verification metric helper with detailed per-class FAR10 thresholds and score-tail quantiles.",
      ),
      artifactRecord(
        sideRecognizerVerificationMarginDiagnosticPath,
        "Side-worktree no-training run4/run5 verification-margin diagnostic script.",
      ),
      artifactRecord(
        recognizerRun6VerificationMarginDiagnosticReceiptFilePath,
        "Focused local run6 verification-margin diagnostic receipt comparing run4/run5 monitor and test splits without training.",
      ),
      artifactRecord(
        recognizerRun6VerifselectDryrunReceiptFilePath,
        "Focused trainer dry-run receipt proving monitor_verification_recall_far10 is computable for checkpoint selection with zero optimizer steps and no checkpoint.",
      ),
      artifactRecord(
        recognizerRun6VerificationMarginPreflightReceiptFilePath,
        "Main-repo run6 verification-margin preflight receipt selecting the T=32 monitor-verification checkpoint-selection fulltrain envelope.",
      ),
      artifactRecord(
        recognizerRun6T32PreflightBlockerReceiptFilePath,
        "Main-repo recognizer run6 T=32 Brev preflight blocker receipt recording SSH/CUDA/process preflight failure, no remote sync/training, and stopped/unhealthy worker teardown.",
      ),
      artifactRecord(
        sideRecognizerRun6VerifselectPretrainDryrunPath,
        "Ignored side-worktree run6 CUDA dry-run receipt copied back from Brev; zero optimizer steps and no checkpoint.",
      ),
      artifactRecord(
        sideRecognizerRun6VerifselectFulltrainReceiptPath,
        "Ignored side-worktree run6 verification-selection fulltrain JSON copied back from Brev; hash is recorded by the main receipt.",
      ),
      artifactRecord(
        sideRecognizerRun6VerifselectFulltrainWeightsPath,
        "Ignored side-worktree run6 verification-selection checkpoint copied back from Brev; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideRecognizerRun6VerifselectFulltrainLogPath,
        "Ignored side-worktree run6 verification-selection fulltrain log copied back from Brev.",
      ),
      artifactRecord(
        recognizerRun6VerifselectFulltrainReceiptFilePath,
        "Main-repo recognizer run6 verification-selection fulltrain receipt recording the new running-best fail-closed metric, copied hashes, teardown, and no-Brev research-tuning next action.",
      ),
      artifactRecord(
        recognizerRun6ResearchTuningPromptFilePath,
        "Run6 recognizer research prompt asking why verification-selection improved recall but still missed the gate and requesting exactly one no-Brev audit plus one gated run7 recipe.",
      ),
      artifactRecord(
        recognizerRun6ResearchTuningRequestFilePath,
        "OpenAI Responses API request for run6 recognizer research tuning.",
      ),
      artifactRecord(
        recognizerRun6ResearchTuningRawFilePath,
        "Raw gpt-5.5 API response for run6 recognizer research tuning.",
      ),
      artifactRecord(
        recognizerRun6ResearchTuningResponseFilePath,
        "Complete gpt-5.5 research memo selecting a run6 verification-tail audit before any class-balanced CE run7.",
      ),
      artifactRecord(
        recognizerRun6ResearchTuningReceiptFilePath,
        "Main-repo run6 recognizer research tuning receipt selecting the local/no-Brev verification-tail audit and preserving the no-training/no-Brev boundary.",
      ),
      artifactRecord(
        sideRecognizerVerificationTailAuditTestPath,
        "Side-worktree focused test for run7 verification-tail class-count, teacher-coverage, and hard-negative audit helpers.",
      ),
      artifactRecord(
        recognizerRun7VerificationTailDiagnosticReceiptFilePath,
        "Detailed local run7 verification-tail audit receipt for run6, joined with split class counts, teacher coverage, score quantiles, and hard-negative pairs.",
      ),
      artifactRecord(
        recognizerRun7VerificationTailAuditReceiptFilePath,
        "Main-repo run7 verification-tail audit summary receipt rejecting class-balanced CE as not proven and selecting a no-Brev hard-negative objective research pass.",
      ),
      artifactRecord(
        recognizerRun7HardNegativeObjectiveResearchPromptFilePath,
        "Run7 hard-negative objective research prompt asking for one no-Brev preflight and one gated OVR-BCE paid-run recipe.",
      ),
      artifactRecord(
        recognizerRun7HardNegativeObjectiveResearchRequestFilePath,
        "OpenAI Responses API request for run7 hard-negative objective research.",
      ),
      artifactRecord(
        recognizerRun7HardNegativeObjectiveResearchRawFilePath,
        "Raw gpt-5.5 API response for run7 hard-negative objective research.",
      ),
      artifactRecord(
        recognizerRun7HardNegativeObjectiveResearchResponseFilePath,
        "Complete gpt-5.5 research memo selecting default-off batch-local OVR-BCE hard-negative preflight before paid run7.",
      ),
      artifactRecord(
        recognizerRun7HardNegativeObjectiveResearchReceiptFilePath,
        "Main-repo run7 hard-negative objective research receipt selecting the local/no-Brev OVR-BCE hard-negative preflight.",
      ),
      artifactRecord(
        recognizerRun7OvrBceHardnegPreflightReceiptFilePath,
        "Main-repo run7 OVR-BCE hard-negative preflight receipt proving default-off parity and safe active batch-local negatives before paid fulltrain.",
      ),
      artifactRecord(
        recognizerRun7OvrBceHardnegDryrunArtifactFilePath,
        "Ignored side-worktree run7 OVR-BCE CUDA dry-run receipt copied back from Brev; zero optimizer steps and no checkpoint.",
      ),
      artifactRecord(
        recognizerRun7OvrBceHardnegFulltrainJsonArtifactFilePath,
        "Ignored side-worktree run7 OVR-BCE fulltrain JSON copied back from Brev; hash is recorded by the main receipt.",
      ),
      artifactRecord(
        recognizerRun7OvrBceHardnegFulltrainPtArtifactFilePath,
        "Ignored side-worktree run7 OVR-BCE checkpoint copied back from Brev; not promoted to browser runtime.",
      ),
      artifactRecord(
        recognizerRun7OvrBceHardnegFulltrainLogArtifactFilePath,
        "Ignored side-worktree run7 OVR-BCE fulltrain log copied back from Brev.",
      ),
      artifactRecord(
        recognizerRun7OvrBceHardnegFulltrainReceiptFilePath,
        "Main-repo run7 OVR-BCE hard-negative fulltrain receipt recording fail-closed regression, copied hashes, teardown, and no-Brev research next action.",
      ),
      artifactRecord(
        recognizerRun7OvrBceResearchTuningPromptFilePath,
        "Run7 OVR-BCE postmortem prompt asking why monitor recall improved while held-out verification recall regressed and requesting one no-Brev diagnostic plus one gated run8 recipe.",
      ),
      artifactRecord(
        recognizerRun7OvrBceResearchTuningRequestFilePath,
        "OpenAI Responses API request for run7 OVR-BCE postmortem research tuning.",
      ),
      artifactRecord(
        recognizerRun7OvrBceResearchTuningRawFilePath,
        "Raw gpt-5.5 API response for run7 OVR-BCE postmortem research tuning.",
      ),
      artifactRecord(
        recognizerRun7OvrBceResearchTuningResponseFilePath,
        "Complete gpt-5.5 research memo selecting a paired run6-vs-run7 verification calibration audit before any paid run8.",
      ),
      artifactRecord(
        recognizerRun7OvrBceResearchTuningReceiptFilePath,
        "Main-repo run7 OVR-BCE research tuning receipt selecting the local/no-Brev paired calibration audit and preserving the no-training/no-Brev boundary.",
      ),
      artifactRecord(
        recognizerRun6VsRun7CalibrationAuditReceiptFilePath,
        "Main-repo run6-vs-run7 paired calibration audit receipt recording confirmed calibration damage but failed run7 local reproduction tolerance and no run8 authorization.",
      ),
      artifactRecord(
        recognizerRun6VsRun7CalibrationDetailedReceiptFilePath,
        "Detailed local/no-Brev run6-vs-run7 paired calibration audit with per-class threshold, score-quantile, margin, rank, and hard-negative-pair deltas.",
      ),
      artifactRecord(
        recognizerRun7TestRecallReproductionDiscrepancyReceiptFilePath,
        "Main-repo run7 test-recall reproduction discrepancy audit resolving the local CPU-vs-original CUDA mismatch as two FAR-threshold boundary flips.",
      ),
      artifactRecord(
        recognizerRun8OvrBceW001PreflightReceiptFilePath,
        "Main-repo run8 OVR-BCE w0.01 no-Brev preflight receipt recording the bounded fulltrain envelope.",
      ),
      artifactRecord(
        recognizerRun8OvrBceW001DryrunReceiptFilePath,
        "Accepted local MPS dry-run receipt for run8 OVR-BCE w0.01, with T32 counts, finite batch-local OVR-BCE loss, and zero optimizer/backward/checkpoint steps.",
      ),
      artifactRecord(
        recognizerRun8OvrBceW001PreflightBlockerReceiptFilePath,
        "Main-repo run8 OVR-BCE w0.01 Brev preflight blocker receipt recording failed SSH preflight before sync, dry-run, training, checkpoint, or final-gate change.",
      ),
      artifactRecord(
        sideRecognizerRun8OvrBceW001FulltrainReceiptPath,
        "Ignored side-worktree run8 OVR-BCE w0.01 fulltrain JSON copied back from Brev; hash is recorded by the main receipt.",
      ),
      artifactRecord(
        sideRecognizerRun8OvrBceW001FulltrainWeightsPath,
        "Ignored side-worktree run8 OVR-BCE w0.01 checkpoint copied back from Brev; not promoted to browser runtime.",
      ),
      artifactRecord(
        sideRecognizerRun8OvrBceW001FulltrainLogPath,
        "Ignored side-worktree run8 OVR-BCE w0.01 fulltrain log copied back from Brev.",
      ),
      artifactRecord(
        sideRecognizerRun8OvrBceW001PretrainDryrunPath,
        "Ignored side-worktree run8 OVR-BCE w0.01 CUDA dry-run receipt copied back from Brev; zero optimizer steps and no checkpoint.",
      ),
      artifactRecord(
        recognizerRun8OvrBceW001FulltrainReceiptFilePath,
        "Main-repo run8 OVR-BCE w0.01 fulltrain receipt recording fail-closed regression, copied hashes, auth-blocked teardown caveat, and no-Brev research next action.",
      ),
      artifactRecord(
        recognizerRun8OvrBceW001ResearchTuningPromptFilePath,
        "Run8 OVR-BCE w0.01 postmortem prompt asking why lower OVR-BCE weight still damaged held-out verification recall and requesting one no-Brev diagnostic plus at most one future recipe.",
      ),
      artifactRecord(
        recognizerRun8OvrBceW001ResearchTuningRequestFilePath,
        "OpenAI Responses API request for run8 OVR-BCE w0.01 postmortem research tuning.",
      ),
      artifactRecord(
        recognizerRun8OvrBceW001ResearchTuningRawFilePath,
        "Raw gpt-5.5 API response for run8 OVR-BCE w0.01 postmortem research tuning.",
      ),
      artifactRecord(
        recognizerRun8OvrBceW001ResearchTuningResponseFilePath,
        "Complete gpt-5.5 research memo recommending no paid OVR-BCE recipe yet and selecting a run6/run7/run8 calibration-tail audit.",
      ),
      artifactRecord(
        recognizerRun8OvrBceW001ResearchTuningReceiptFilePath,
        "Main-repo run8 OVR-BCE w0.01 research tuning receipt selecting the local/no-Brev three-run calibration-tail audit and preserving the no-training/no-Brev boundary.",
      ),
      artifactRecord(
        recognizerRun6Run7Run8CalibrationTailDetailedReceiptFilePath,
        "Detailed local/no-Brev three-run run6/run7/run8 calibration-tail audit with per-class threshold, margin, negative-tail, failure-word, and checkpoint-transfer comparisons.",
      ),
      artifactRecord(
        recognizerRun6Run7Run8CalibrationTailAuditReceiptFilePath,
        "Main-repo run6/run7/run8 calibration-tail audit receipt recording monitor-vs-test mismatch, run8 regression classification, no paid recipe selection, and next no-Brev calibration-safe research action.",
      ),
      artifactRecord(
        recognizerPostOvrBceCalibrationSafeResearchPromptFilePath,
        "Post-OVR-BCE calibration-safe research prompt asking for exactly one no-Brev local preflight from the run6 base.",
      ),
      artifactRecord(
        recognizerPostOvrBceCalibrationSafeResearchRequestFilePath,
        "OpenAI Responses API request for post-OVR-BCE calibration-safe research.",
      ),
      artifactRecord(
        recognizerPostOvrBceCalibrationSafeResearchRawFilePath,
        "Raw gpt-5.5 API response for post-OVR-BCE calibration-safe research.",
      ),
      artifactRecord(
        recognizerPostOvrBceCalibrationSafeResearchResponseFilePath,
        "Complete gpt-5.5 research memo selecting the run6 monitor-selection stability preflight and no paid recipe yet.",
      ),
      artifactRecord(
        recognizerPostOvrBceCalibrationSafeResearchReceiptFilePath,
        "Main-repo post-OVR-BCE calibration-safe research receipt selecting the run6 monitor-selection stability preflight and preserving the no-training/no-Brev boundary.",
      ),
      artifactRecord(
        recognizerRun6MonitorSelectionStabilityDetailedReceiptFilePath,
        "Detailed artifact-only run6 monitor-selection stability preflight showing epoch 31 robust selectors cannot be held-out scored without retained candidate checkpoints or logits.",
      ),
      artifactRecord(
        recognizerRun6MonitorSelectionStabilityPreflightReceiptFilePath,
        "Main-repo run6 monitor-selection stability preflight receipt recording fail-closed artifact insufficiency and next candidate-checkpoint retention preflight.",
      ),
      artifactRecord(
        recognizerCandidateCheckpointRetentionDryrunReceiptFilePath,
        "Full T=32 no-save dry-run receipt proving candidate checkpoint retention stays no-write during dry-run and records planned future selector retention.",
      ),
      artifactRecord(
        recognizerCandidateCheckpointRetentionPreflightReceiptFilePath,
        "Main-repo candidate checkpoint retention preflight receipt recording default-off retention support, zero optimizer steps, no checkpoint writes, and no paid recipe.",
      ),
      artifactRecord(
        recognizerRetentionEnabledResearchTuningPromptFilePath,
        "Retention-enabled research prompt asking for exactly one next no-Brev slice now that candidate checkpoint retention exists.",
      ),
      artifactRecord(
        recognizerRetentionEnabledResearchTuningRequestFilePath,
        "OpenAI Responses API request for retention-enabled recognizer tuning research.",
      ),
      artifactRecord(
        recognizerRetentionEnabledResearchTuningRawFilePath,
        "Raw gpt-5.5 API response for retention-enabled recognizer tuning research.",
      ),
      artifactRecord(
        recognizerRetentionEnabledResearchTuningResponseFilePath,
        "Complete gpt-5.5 research memo selecting the no-Brev run9 retention-enabled run6 recipe preflight.",
      ),
      artifactRecord(
        recognizerRetentionEnabledResearchTuningReceiptFilePath,
        "Main-repo retention-enabled research tuning receipt preserving no-Brev/no-training boundaries and selecting the run9 recipe preflight.",
      ),
      artifactRecord(
        recognizerRun9RetentionEnabledRun6RecipePreflightDryrunReceiptFilePath,
        "Full T=32 no-save dry-run receipt validating the run9 retention-enabled run6-base recipe with zero optimizer steps and no checkpoint output.",
      ),
      artifactRecord(
        recognizerRun9RetentionEnabledRun6RecipePreflightReceiptFilePath,
        "Main-repo run9 retention-enabled run6 recipe preflight recording future fulltrain envelope, kill criteria, and the Brev auth visibility blocker.",
      ),
      artifactRecord(
        recognizerRun9BrevAuthVisibilityRefreshReceiptFilePath,
        "No-spend Brev CLI visibility refresh receipt recording the logged-out/EOF auth blocker and human-login next action.",
      ),
      artifactRecord(
        recognizerRun9BrevAuthVisibilityRetryReceiptFilePath,
        "No-spend Brev CLI visibility retry receipt recording that auth is still logged out and the human-login next action remains unchanged.",
      ),
      artifactRecord(
        recognizerRun9BrevAuthHumanLoginBoundaryReceiptFilePath,
        "No-spend Brev auth boundary receipt parking further automated visibility retries until explicit human login confirmation.",
      ),
      artifactRecord(focusLabelsPath, "User-supplied focus-frame offline MediaPipe diagnostic labels."),
      artifactRecord(focusDebugSummaryPath, "Browser debug harness summary against focus-frame labels."),
    ],
    current_state: {
      compute_policy: {
        receipt: rel(computePolicyReceiptFilePath),
        status: computePolicyReceipt.status ?? null,
        brev_nvidia_compute_authorized:
          computePolicyReceipt.policy?.brev_nvidia_compute_authorized ?? null,
        do_not_downsize_for_local_runtime:
          computePolicyReceipt.policy?.do_not_downsize_for_local_runtime ?? null,
        local_smoke_runs_allowed:
          computePolicyReceipt.policy?.local_smoke_runs_allowed ?? null,
        full_scope_evidence_should_use_brev_when_local_runtime_would_force_reduction:
          computePolicyReceipt.policy
            ?.full_scope_evidence_should_use_brev_when_local_runtime_would_force_reduction ?? null,
        boundaries: computePolicyReceipt.boundaries ?? null,
      },
      active_directive_evidence: {
        directive: recognizerRun9RetentionEnabledRun6RecipePreflightNextAction,
        previous_directive_completed:
          "m3jb_recognizer_transformer_retention_enabled_research_guided_tuning_no_brev completed the no-Brev research pass, recorded gpt-5.5 fallback artifacts, selected no paid fulltrain now, and chose a run9 retention-enabled run6 recipe preflight",
        this_slice:
          "recognizer_retention_enabled_research_tuning_completed_no_brev_no_training",
        brev_used: false,
        brev_read_only_visibility: false,
        brev_lifecycle_or_exec: false,
        retained_worker_left_running_under_approved_queued_work: false,
        training_run: false,
        checkpoint_written: false,
        worker_stop_verified_by_brev_ls: false,
        worker_ssh_reachable_after_shutdown: false,
        final_gate_changed: false,
        next_step: recognizerRun9RetentionEnabledRun6RecipePreflightNextAction,
        existing_audit_surface: "node scripts/audit_m3jb_hand_state_tracker.mjs --write-receipt",
      },
      heuristic_top2nms_baseline: heuristicTop2NmsBaseline,
      deterministic_postfilter_ceiling: deterministicPostfilterCeiling,
      browser_product_requirement_evidence: browserRequirementEvidence,
      product_gate_reframe_question: productGateQuestion,
      current_vs_future_box_gate_split: currentVsFutureBoxGateSplit,
      proposal_metrics: proposalMetrics,
      landmark_metrics: landmarkMetrics,
      landmark_heatmap_evidence: landmarkHeatmapEvidence,
      landmark_heatmap_filter_decision: landmarkHeatmapFilterDecision,
      landmark_cache_rebuild_eval: landmarkCacheRebuildEval,
      landmark_retrain_brev_plan: landmarkRetrainBrevPlan,
      landmark_retrain_brev_run: landmarkRetrainBrevRun,
      landmark_retrain_regression_pivot: landmarkRetrainRegressionPivot,
      landmark_pck_campaign_research_plan: landmarkPckCampaignResearchPlan,
      landmark_pck_campaign_run1: landmarkPckCampaignRun1Summary,
      landmark_pck_campaign_run2: landmarkPckCampaignRun2Summary,
      landmark_pck_campaign_run3: landmarkPckCampaignRun3Summary,
      landmark_pck_research_refresh_after_run3:
        landmarkPckResearchRefreshAfterRun3Summary,
      landmark_pck_resunet_architecture_preflight:
        landmarkPckResunetArchitecturePreflightSummary,
      recognizer_scheduler_preflight: {
        status: recognizerSchedulerPreflightReceipt.status ?? null,
        side_worktree: recognizerSchedulerPreflightReceipt.side_worktree ?? null,
        implementation: recognizerSchedulerPreflightReceipt.implementation ?? null,
        tiny_overfit:
          recognizerSchedulerPreflightReceipt.local_preflight?.tiny_overfit ?? null,
        full_data_smoke:
          recognizerSchedulerPreflightReceipt.local_preflight?.full_data_smoke ?? null,
        run3_envelope: recognizerSchedulerPreflightReceipt.run3_envelope ?? null,
        runtime_boundary: recognizerSchedulerPreflightReceipt.runtime_boundary ?? null,
        next_action: recognizerSchedulerPreflightReceipt.next_action ?? null,
      },
      recognizer_run3_scheduler_fulltrain: {
        status: recognizerRun3SchedulerFulltrainReceipt.status ?? null,
        worker: recognizerRun3SchedulerFulltrainReceipt.worker ?? null,
        run: recognizerRun3SchedulerFulltrainReceipt.run ?? null,
        metrics: recognizerRun3SchedulerFulltrainReceipt.metrics ?? null,
        artifacts: recognizerRun3SchedulerFulltrainReceipt.artifacts ?? null,
        runtime_boundary:
          recognizerRun3SchedulerFulltrainReceipt.runtime_boundary ?? null,
        next_action: recognizerRun3SchedulerFulltrainReceipt.next_action ?? null,
      },
      recognizer_run3_research_tuning: {
        status: recognizerRun3ResearchTuningReceipt.status ?? null,
        run3_summary: recognizerRun3ResearchTuningReceipt.run3_summary ?? null,
        trainer_surface: recognizerRun3ResearchTuningReceipt.trainer_surface ?? null,
        research_escalation:
          recognizerRun3ResearchTuningReceipt.research_escalation ?? null,
        research_conclusion:
          recognizerRun3ResearchTuningReceipt.research_conclusion ?? null,
        boundaries: recognizerRun3ResearchTuningReceipt.boundaries ?? null,
        next_action: recognizerRun3ResearchTuningReceipt.next_action ?? null,
      },
      recognizer_t32_cache_loader_preflight: {
        status: recognizerT32CacheLoaderPreflightReceipt.status ?? null,
        side_worktree:
          recognizerT32CacheLoaderPreflightReceipt.side_worktree ?? null,
        implementation:
          recognizerT32CacheLoaderPreflightReceipt.implementation ?? null,
        local_preflight:
          recognizerT32CacheLoaderPreflightReceipt.local_preflight ?? null,
        dryrun_receipt: {
          path: recognizerT32LoaderDryrunReceiptPath,
          training_mode: recognizerT32LoaderDryrunReceipt.training_mode ?? null,
          student_cache: recognizerT32LoaderDryrunReceipt.student_cache ?? null,
          dry_run_forward:
            recognizerT32LoaderDryrunReceipt.dry_run_forward ?? null,
          optimizer_steps: recognizerT32LoaderDryrunReceipt.optimizer_steps ?? null,
          expected_optimizer_steps:
            recognizerT32LoaderDryrunReceipt.expected_optimizer_steps ?? null,
          weights: recognizerT32LoaderDryrunReceipt.weights ?? null,
        },
        cache_inventory:
          recognizerT32CacheLoaderPreflightReceipt.cache_inventory ?? null,
        runtime_boundary:
          recognizerT32CacheLoaderPreflightReceipt.runtime_boundary ?? null,
        next_action: recognizerT32CacheLoaderPreflightReceipt.next_action ?? null,
      },
      recognizer_t32_cache_smoke_validate: {
        status: recognizerT32CacheSmokeValidateReceipt.status ?? null,
        cache: recognizerT32CacheSmokeValidateReceipt.cache ?? null,
        dryrun: {
          path: recognizerT32CacheSmokeDryrunReceiptPath,
          training_mode:
            recognizerT32CacheSmokeDryrunReceipt.training_mode ?? null,
          student_cache:
            recognizerT32CacheSmokeDryrunReceipt.student_cache ?? null,
          dry_run_forward:
            recognizerT32CacheSmokeDryrunReceipt.dry_run_forward ?? null,
          optimizer_steps:
            recognizerT32CacheSmokeDryrunReceipt.optimizer_steps ?? null,
          expected_optimizer_steps:
            recognizerT32CacheSmokeDryrunReceipt.expected_optimizer_steps ?? null,
          weights: recognizerT32CacheSmokeDryrunReceipt.weights ?? null,
        },
        runtime_boundary:
          recognizerT32CacheSmokeValidateReceipt.runtime_boundary ?? null,
        next_action: recognizerT32CacheSmokeValidateReceipt.next_action ?? null,
      },
      recognizer_t32_full_cache_validate: {
        status: recognizerT32FullCacheValidateReceipt.status ?? null,
        cache: recognizerT32FullCacheValidateReceipt.cache ?? null,
        dryrun: {
          path: recognizerT32FullCacheDryrunReceiptPath,
          training_mode:
            recognizerT32FullCacheDryrunReceipt.training_mode ?? null,
          student_cache:
            recognizerT32FullCacheDryrunReceipt.student_cache ?? null,
          dry_run_forward:
            recognizerT32FullCacheDryrunReceipt.dry_run_forward ?? null,
          optimizer_steps:
            recognizerT32FullCacheDryrunReceipt.optimizer_steps ?? null,
          expected_optimizer_steps:
            recognizerT32FullCacheDryrunReceipt.expected_optimizer_steps ?? null,
          planned_optimizer_steps:
            recognizerT32FullCacheDryrunReceipt.planned_optimizer_steps ?? null,
          weights: recognizerT32FullCacheDryrunReceipt.weights ?? null,
        },
        run4_envelope:
          recognizerT32FullCacheValidateReceipt.run4_envelope ?? null,
        runtime_boundary:
          recognizerT32FullCacheValidateReceipt.runtime_boundary ?? null,
        next_action: recognizerT32FullCacheValidateReceipt.next_action ?? null,
      },
      recognizer_run4_t32_preflight_blocker: {
        status: recognizerRun4T32PreflightBlockerReceipt.status ?? null,
        approval: recognizerRun4T32PreflightBlockerReceipt.approval ?? null,
        worker: recognizerRun4T32PreflightBlockerReceipt.worker ?? null,
        local_hashes: recognizerRun4T32PreflightBlockerReceipt.local_hashes ?? null,
        sync: recognizerRun4T32PreflightBlockerReceipt.sync ?? null,
        run: recognizerRun4T32PreflightBlockerReceipt.run ?? null,
        runtime_boundary:
          recognizerRun4T32PreflightBlockerReceipt.runtime_boundary ?? null,
        next_action: recognizerRun4T32PreflightBlockerReceipt.next_action ?? null,
      },
      recognizer_run4_t32_health_refresh: {
        status: recognizerRun4T32HealthRefreshReceipt.status ?? null,
        initial_brev_ls:
          recognizerRun4T32HealthRefreshReceipt.initial_brev_ls ?? null,
        final_read_only_brev_ls:
          recognizerRun4T32HealthRefreshReceipt.final_read_only_brev_ls ?? null,
        decision: recognizerRun4T32HealthRefreshReceipt.decision ?? null,
        runtime_boundary:
          recognizerRun4T32HealthRefreshReceipt.runtime_boundary ?? null,
        next_action: recognizerRun4T32HealthRefreshReceipt.next_action ?? null,
      },
      recognizer_run4_t32_fulltrain: {
        status: recognizerRun4T32FulltrainReceipt.status ?? null,
        worker: recognizerRun4T32FulltrainReceipt.worker ?? null,
        sync: recognizerRun4T32FulltrainReceipt.sync ?? null,
        dryrun: recognizerRun4T32FulltrainReceipt.dryrun ?? null,
        run: recognizerRun4T32FulltrainReceipt.run ?? null,
        metrics: recognizerRun4T32FulltrainReceipt.metrics ?? null,
        artifacts: recognizerRun4T32FulltrainReceipt.artifacts ?? null,
        runtime_boundary:
          recognizerRun4T32FulltrainReceipt.runtime_boundary ?? null,
        next_action: recognizerRun4T32FulltrainReceipt.next_action ?? null,
      },
      recognizer_run4_research_tuning: {
        status: recognizerRun4ResearchTuningReceipt.status ?? null,
        run4_summary: recognizerRun4ResearchTuningReceipt.run4_summary ?? null,
        trainer_surface: recognizerRun4ResearchTuningReceipt.trainer_surface ?? null,
        research_escalation:
          recognizerRun4ResearchTuningReceipt.research_escalation ?? null,
        research_conclusion:
          recognizerRun4ResearchTuningReceipt.research_conclusion ?? null,
        brev_visibility:
          recognizerRun4ResearchTuningReceipt.brev_visibility ?? null,
        boundaries: recognizerRun4ResearchTuningReceipt.boundaries ?? null,
        next_action: recognizerRun4ResearchTuningReceipt.next_action ?? null,
      },
      recognizer_run5_supcon_preflight: {
        status: recognizerRun5SupconPreflightReceipt.status ?? null,
        side_worktree: recognizerRun5SupconPreflightReceipt.side_worktree ?? null,
        implementation: recognizerRun5SupconPreflightReceipt.implementation ?? null,
        zero_weight_dryrun: {
          path: recognizerRun5SupconZeroWeightDryrunReceiptPath,
          training_mode:
            recognizerRun5SupconZeroWeightDryrunReceipt.training_mode ?? null,
          student_cache:
            recognizerRun5SupconZeroWeightDryrunReceipt.student_cache ?? null,
          dry_run_forward:
            recognizerRun5SupconZeroWeightDryrunReceipt.dry_run_forward ?? null,
          optimizer_steps:
            recognizerRun5SupconZeroWeightDryrunReceipt.optimizer_steps ?? null,
          expected_optimizer_steps:
            recognizerRun5SupconZeroWeightDryrunReceipt.expected_optimizer_steps ?? null,
          planned_optimizer_steps:
            recognizerRun5SupconZeroWeightDryrunReceipt.planned_optimizer_steps ?? null,
          weights: recognizerRun5SupconZeroWeightDryrunReceipt.weights ?? null,
        },
        weighted_supcon_dryrun: {
          path: recognizerRun5SupconWeight005DryrunReceiptPath,
          training_mode:
            recognizerRun5SupconWeight005DryrunReceipt.training_mode ?? null,
          student_cache:
            recognizerRun5SupconWeight005DryrunReceipt.student_cache ?? null,
          dry_run_forward:
            recognizerRun5SupconWeight005DryrunReceipt.dry_run_forward ?? null,
          optimizer_steps:
            recognizerRun5SupconWeight005DryrunReceipt.optimizer_steps ?? null,
          expected_optimizer_steps:
            recognizerRun5SupconWeight005DryrunReceipt.expected_optimizer_steps ?? null,
          planned_optimizer_steps:
            recognizerRun5SupconWeight005DryrunReceipt.planned_optimizer_steps ?? null,
          weights: recognizerRun5SupconWeight005DryrunReceipt.weights ?? null,
        },
        run5_envelope:
          recognizerRun5SupconPreflightReceipt.run5_recipe_if_preflight_passes ?? null,
        boundaries: recognizerRun5SupconPreflightReceipt.boundaries ?? null,
        next_action: recognizerRun5SupconPreflightReceipt.next_action ?? null,
      },
      recognizer_run5_supcon_fulltrain: {
        status: recognizerRun5SupconFulltrainReceipt.status ?? null,
        worker: recognizerRun5SupconFulltrainReceipt.worker ?? null,
        sync: recognizerRun5SupconFulltrainReceipt.sync ?? null,
        dryrun: recognizerRun5SupconFulltrainReceipt.dryrun ?? null,
        run: recognizerRun5SupconFulltrainReceipt.run ?? null,
        metrics: recognizerRun5SupconFulltrainReceipt.metrics ?? null,
        artifacts: recognizerRun5SupconFulltrainReceipt.artifacts ?? null,
        runtime_boundary:
          recognizerRun5SupconFulltrainReceipt.runtime_boundary ?? null,
        next_action: recognizerRun5SupconFulltrainReceipt.next_action ?? null,
      },
      recognizer_run5_research_tuning: {
        status: recognizerRun5ResearchTuningReceipt.status ?? null,
        run4_vs_run5: recognizerRun5ResearchTuningReceipt.run4_vs_run5 ?? null,
        metric_definition:
          recognizerRun5ResearchTuningReceipt.metric_definition ?? null,
        trainer_surface: recognizerRun5ResearchTuningReceipt.trainer_surface ?? null,
        research_escalation:
          recognizerRun5ResearchTuningReceipt.research_escalation ?? null,
        research_conclusion:
          recognizerRun5ResearchTuningReceipt.research_conclusion ?? null,
        brev_visibility: recognizerRun5ResearchTuningReceipt.brev_visibility ?? null,
        boundaries: recognizerRun5ResearchTuningReceipt.boundaries ?? null,
        next_action: recognizerRun5ResearchTuningReceipt.next_action ?? null,
      },
      recognizer_run6_verification_margin_preflight: {
        status: recognizerRun6VerificationMarginPreflightReceipt.status ?? null,
        side_worktree:
          recognizerRun6VerificationMarginPreflightReceipt.side_worktree ?? null,
        implementation:
          recognizerRun6VerificationMarginPreflightReceipt.implementation ?? null,
        verification_margin_diagnostic: {
          path: recognizerRun6VerificationMarginDiagnosticReceiptPath,
          status: recognizerRun6VerificationMarginDiagnosticReceipt.status ?? null,
          actual_counts:
            recognizerRun6VerificationMarginDiagnosticReceipt.actual_counts ?? null,
          comparisons:
            recognizerRun6VerificationMarginDiagnosticReceipt.comparisons ?? null,
          run4_reproduction:
            recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run4?.reproduction ?? null,
          run5_reproduction:
            recognizerRun6VerificationMarginDiagnosticReceipt.runs?.run5?.reproduction ?? null,
        },
        verifselect_dryrun: {
          path: recognizerRun6VerifselectDryrunReceiptPath,
          training_mode: recognizerRun6VerifselectDryrunReceipt.training_mode ?? null,
          student_cache: recognizerRun6VerifselectDryrunReceipt.student_cache ?? null,
          dry_run_forward:
            recognizerRun6VerifselectDryrunReceipt.dry_run_forward ?? null,
          checkpoint_selection:
            recognizerRun6VerifselectDryrunReceipt.checkpoint_selection ?? null,
          optimizer_steps:
            recognizerRun6VerifselectDryrunReceipt.optimizer_steps ?? null,
          planned_optimizer_steps:
            recognizerRun6VerifselectDryrunReceipt.planned_optimizer_steps ?? null,
          weights: recognizerRun6VerifselectDryrunReceipt.weights ?? null,
        },
        run6_envelope:
          recognizerRun6VerificationMarginPreflightReceipt.run6_recipe_if_preflight_passes ?? null,
        boundaries:
          recognizerRun6VerificationMarginPreflightReceipt.boundaries ?? null,
        next_action:
          recognizerRun6VerificationMarginPreflightReceipt.next_action ?? null,
      },
      recognizer_run6_t32_preflight_blocker: {
        status: recognizerRun6T32PreflightBlockerReceipt.status ?? null,
        approval: recognizerRun6T32PreflightBlockerReceipt.approval ?? null,
        worker: recognizerRun6T32PreflightBlockerReceipt.worker ?? null,
        sync: recognizerRun6T32PreflightBlockerReceipt.sync ?? null,
        run: recognizerRun6T32PreflightBlockerReceipt.run ?? null,
        runtime_boundary:
          recognizerRun6T32PreflightBlockerReceipt.runtime_boundary ?? null,
        next_action:
          recognizerRun6T32PreflightBlockerReceipt.next_action ?? null,
      },
      recognizer_run6_verifselect_fulltrain: {
        status: recognizerRun6VerifselectFulltrainReceipt.status ?? null,
        approval: recognizerRun6VerifselectFulltrainReceipt.approval ?? null,
        worker: recognizerRun6VerifselectFulltrainReceipt.worker ?? null,
        sync: recognizerRun6VerifselectFulltrainReceipt.sync ?? null,
        remote_dry_run:
          recognizerRun6VerifselectFulltrainReceipt.remote_dry_run ?? null,
        run: recognizerRun6VerifselectFulltrainReceipt.run ?? null,
        comparison: recognizerRun6VerifselectFulltrainReceipt.comparison ?? null,
        artifacts: recognizerRun6VerifselectFulltrainReceipt.artifacts ?? null,
        runtime_boundary:
          recognizerRun6VerifselectFulltrainReceipt.runtime_boundary ?? null,
        next_action:
          recognizerRun6VerifselectFulltrainReceipt.next_action ?? null,
      },
      recognizer_run6_research_tuning: {
        status: recognizerRun6ResearchTuningReceipt.status ?? null,
        run6_summary: recognizerRun6ResearchTuningReceipt.run6_summary ?? null,
        research_escalation:
          recognizerRun6ResearchTuningReceipt.research_escalation ?? null,
        research_conclusion:
          recognizerRun6ResearchTuningReceipt.research_conclusion ?? null,
        brev_visibility:
          recognizerRun6ResearchTuningReceipt.brev_visibility ?? null,
        boundaries: recognizerRun6ResearchTuningReceipt.boundaries ?? null,
        next_action: recognizerRun6ResearchTuningReceipt.next_action ?? null,
      },
      recognizer_run7_verification_tail_audit: {
        status: recognizerRun7VerificationTailAuditReceipt.status ?? null,
        reproduction:
          recognizerRun7VerificationTailAuditReceipt.reproduction ?? null,
        tail_conclusion:
          recognizerRun7VerificationTailAuditReceipt.tail_conclusion ?? null,
        future_paid_candidate_decision:
          recognizerRun7VerificationTailAuditReceipt
            .future_paid_candidate_decision ?? null,
        next_action:
          recognizerRun7VerificationTailAuditReceipt.next_action ?? null,
      },
      recognizer_run7_hard_negative_objective_research: {
        status:
          recognizerRun7HardNegativeObjectiveResearchReceipt.status ?? null,
        tail_evidence_summary:
          recognizerRun7HardNegativeObjectiveResearchReceipt
            .tail_evidence_summary ?? null,
        research_escalation:
          recognizerRun7HardNegativeObjectiveResearchReceipt
            .research_escalation ?? null,
        research_conclusion:
          recognizerRun7HardNegativeObjectiveResearchReceipt
            .research_conclusion ?? null,
        brev_visibility:
          recognizerRun7HardNegativeObjectiveResearchReceipt
            .brev_visibility ?? null,
        boundaries:
          recognizerRun7HardNegativeObjectiveResearchReceipt.boundaries ?? null,
        next_action:
          recognizerRun7HardNegativeObjectiveResearchReceipt.next_action ?? null,
      },
      recognizer_run7_ovr_bce_hardneg_fulltrain: {
        status:
          recognizerRun7OvrBceHardnegFulltrainReceipt.status ?? null,
        approval:
          recognizerRun7OvrBceHardnegFulltrainReceipt.approval ?? null,
        worker:
          recognizerRun7OvrBceHardnegFulltrainReceipt.worker ?? null,
        sync: recognizerRun7OvrBceHardnegFulltrainReceipt.sync ?? null,
        remote_dry_run:
          recognizerRun7OvrBceHardnegFulltrainReceipt.remote_dry_run ?? null,
        aborted_launch_correction:
          recognizerRun7OvrBceHardnegFulltrainReceipt
            .aborted_launch_correction ?? null,
        run: recognizerRun7OvrBceHardnegFulltrainReceipt.run ?? null,
        comparison:
          recognizerRun7OvrBceHardnegFulltrainReceipt.comparison ?? null,
        artifacts:
          recognizerRun7OvrBceHardnegFulltrainReceipt.artifacts ?? null,
        boundaries:
          recognizerRun7OvrBceHardnegFulltrainReceipt.boundaries ?? null,
        next_action:
          recognizerRun7OvrBceHardnegFulltrainReceipt.next_action ?? null,
      },
      recognizer_run7_ovr_bce_research_tuning: {
        status: recognizerRun7OvrBceResearchTuningReceipt.status ?? null,
        run6_vs_run7_summary:
          recognizerRun7OvrBceResearchTuningReceipt.run6_vs_run7_summary ?? null,
        research_escalation:
          recognizerRun7OvrBceResearchTuningReceipt.research_escalation ?? null,
        research_conclusion:
          recognizerRun7OvrBceResearchTuningReceipt.research_conclusion ?? null,
        brev_visibility:
          recognizerRun7OvrBceResearchTuningReceipt.brev_visibility ?? null,
        boundaries:
          recognizerRun7OvrBceResearchTuningReceipt.boundaries ?? null,
        next_action:
          recognizerRun7OvrBceResearchTuningReceipt.next_action ?? null,
      },
      recognizer_run6_vs_run7_paired_calibration_audit: {
        status: recognizerRun6VsRun7CalibrationAuditReceipt.status ?? null,
        reproduction:
          recognizerRun6VsRun7CalibrationAuditReceipt.reproduction ?? null,
        paired_calibration_audit:
          recognizerRun6VsRun7CalibrationAuditReceipt.paired_calibration_audit ?? null,
        decision: recognizerRun6VsRun7CalibrationAuditReceipt.decision ?? null,
        boundaries:
          recognizerRun6VsRun7CalibrationAuditReceipt.boundaries ?? null,
        next_action:
          recognizerRun6VsRun7CalibrationAuditReceipt.next_action ?? null,
      },
      recognizer_run7_test_recall_reproduction_discrepancy_audit: {
        status:
          recognizerRun7TestRecallReproductionDiscrepancyReceipt.status ?? null,
        provenance_checks:
          recognizerRun7TestRecallReproductionDiscrepancyReceipt.provenance_checks ?? null,
        local_recompute:
          recognizerRun7TestRecallReproductionDiscrepancyReceipt.local_recompute ?? null,
        class_level_delta:
          recognizerRun7TestRecallReproductionDiscrepancyReceipt.class_level_delta ?? null,
        resolution:
          recognizerRun7TestRecallReproductionDiscrepancyReceipt.resolution ?? null,
        decision:
          recognizerRun7TestRecallReproductionDiscrepancyReceipt.decision ?? null,
        next_action:
          recognizerRun7TestRecallReproductionDiscrepancyReceipt.next_action ?? null,
      },
      recognizer_run8_ovr_bce_w001_preflight: {
        status: recognizerRun8OvrBceW001PreflightReceipt.status ?? null,
        side_worktree:
          recognizerRun8OvrBceW001PreflightReceipt.side_worktree ?? null,
        local_preflight:
          recognizerRun8OvrBceW001PreflightReceipt.local_preflight ?? null,
        comparison_against_run7_weight003_preflight:
          recognizerRun8OvrBceW001PreflightReceipt
            .comparison_against_run7_weight003_preflight ?? null,
        brev_visibility:
          recognizerRun8OvrBceW001PreflightReceipt.brev_visibility ?? null,
        future_run8_envelope:
          recognizerRun8OvrBceW001PreflightReceipt.future_run8_envelope ?? null,
        boundaries:
          recognizerRun8OvrBceW001PreflightReceipt.boundaries ?? null,
        next_action:
          recognizerRun8OvrBceW001PreflightReceipt.next_action ?? null,
      },
      recognizer_run8_ovr_bce_w001_brev_preflight_blocker: {
        status: recognizerRun8OvrBceW001PreflightBlockerReceipt.status ?? null,
        worker: recognizerRun8OvrBceW001PreflightBlockerReceipt.worker ?? null,
        approval: recognizerRun8OvrBceW001PreflightBlockerReceipt.approval ?? null,
        ssh_cuda_process_preflight:
          recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
            ?.ssh_cuda_process_preflight ?? null,
        teardown:
          recognizerRun8OvrBceW001PreflightBlockerReceipt.brev_lifecycle
            ?.teardown ?? null,
        remote_work:
          recognizerRun8OvrBceW001PreflightBlockerReceipt.remote_work ?? null,
        boundaries:
          recognizerRun8OvrBceW001PreflightBlockerReceipt.boundaries ?? null,
        decision:
          recognizerRun8OvrBceW001PreflightBlockerReceipt.decision ?? null,
        next_action:
          recognizerRun8OvrBceW001PreflightBlockerReceipt.next_action ?? null,
      },
      recognizer_run8_ovr_bce_w001_fulltrain: {
        status: recognizerRun8OvrBceW001FulltrainReceipt.status ?? null,
        approval: recognizerRun8OvrBceW001FulltrainReceipt.approval ?? null,
        worker: recognizerRun8OvrBceW001FulltrainReceipt.worker ?? null,
        remote_preflight:
          recognizerRun8OvrBceW001FulltrainReceipt.remote_preflight ?? null,
        sync: recognizerRun8OvrBceW001FulltrainReceipt.sync ?? null,
        remote_dry_run:
          recognizerRun8OvrBceW001FulltrainReceipt.remote_dry_run ?? null,
        run: recognizerRun8OvrBceW001FulltrainReceipt.run ?? null,
        comparison: recognizerRun8OvrBceW001FulltrainReceipt.comparison ?? null,
        artifacts: recognizerRun8OvrBceW001FulltrainReceipt.artifacts ?? null,
        teardown: recognizerRun8OvrBceW001FulltrainReceipt.teardown ?? null,
        runtime_boundary:
          recognizerRun8OvrBceW001FulltrainReceipt.runtime_boundary ?? null,
        next_action:
          recognizerRun8OvrBceW001FulltrainReceipt.next_action ?? null,
      },
      recognizer_run8_ovr_bce_w001_research_tuning: {
        status: recognizerRun8OvrBceW001ResearchTuningReceipt.status ?? null,
        run6_run7_run8_summary:
          recognizerRun8OvrBceW001ResearchTuningReceipt
            .run6_run7_run8_summary ?? null,
        research_escalation:
          recognizerRun8OvrBceW001ResearchTuningReceipt
            .research_escalation ?? null,
        research_conclusion:
          recognizerRun8OvrBceW001ResearchTuningReceipt
            .research_conclusion ?? null,
        boundaries:
          recognizerRun8OvrBceW001ResearchTuningReceipt.boundaries ?? null,
        next_action:
          recognizerRun8OvrBceW001ResearchTuningReceipt.next_action ?? null,
      },
      recognizer_run6_run7_run8_calibration_tail_audit: {
        status:
          recognizerRun6Run7Run8CalibrationTailAuditReceipt.status ?? null,
        run_summary:
          recognizerRun6Run7Run8CalibrationTailAuditReceipt.run_summary
            ?? null,
        pairwise_deltas:
          recognizerRun6Run7Run8CalibrationTailAuditReceipt.pairwise_deltas
            ?? null,
        checkpoint_selection_transfer:
          recognizerRun6Run7Run8CalibrationTailAuditReceipt
            .checkpoint_selection_transfer ?? null,
        decision:
          recognizerRun6Run7Run8CalibrationTailAuditReceipt.decision ?? null,
        boundaries:
          recognizerRun6Run7Run8CalibrationTailAuditReceipt.boundaries ?? null,
        next_action:
          recognizerRun6Run7Run8CalibrationTailAuditReceipt.next_action ?? null,
      },
      recognizer_post_ovr_bce_calibration_safe_research: {
        status:
          recognizerPostOvrBceCalibrationSafeResearchReceipt.status ?? null,
        research_escalation:
          recognizerPostOvrBceCalibrationSafeResearchReceipt
            .research_escalation ?? null,
        research_conclusion:
          recognizerPostOvrBceCalibrationSafeResearchReceipt
            .research_conclusion ?? null,
        boundaries:
          recognizerPostOvrBceCalibrationSafeResearchReceipt.boundaries ?? null,
        next_action:
          recognizerPostOvrBceCalibrationSafeResearchReceipt.next_action
            ?? null,
      },
      recognizer_run6_monitor_selection_stability_preflight: {
        status:
          recognizerRun6MonitorSelectionStabilityPreflightReceipt.status
            ?? null,
        run6_result:
          recognizerRun6MonitorSelectionStabilityPreflightReceipt.run6_result
            ?? null,
        selector_transfer_preflight:
          recognizerRun6MonitorSelectionStabilityPreflightReceipt
            .selector_transfer_preflight ?? null,
        detailed_decision:
          recognizerRun6MonitorSelectionStabilityDetailedReceipt.decision
            ?? null,
        boundaries:
          recognizerRun6MonitorSelectionStabilityPreflightReceipt.boundaries
            ?? null,
        next_action:
          recognizerRun6MonitorSelectionStabilityPreflightReceipt.decision
            ?.next_action ?? null,
      },
      recognizer_candidate_checkpoint_retention_preflight: {
        status:
          recognizerCandidateCheckpointRetentionPreflightReceipt.status
            ?? null,
        dryrun_result:
          recognizerCandidateCheckpointRetentionPreflightReceipt.dryrun_result
            ?? null,
        dryrun_retention:
          recognizerCandidateCheckpointRetentionDryrunReceipt
            .candidate_checkpoint_retention ?? null,
        boundaries:
          recognizerCandidateCheckpointRetentionPreflightReceipt.boundaries
            ?? null,
        next_action:
          recognizerCandidateCheckpointRetentionPreflightReceipt.decision
            ?.next_action ?? null,
      },
      recognizer_retention_enabled_research_tuning: {
        status:
          recognizerRetentionEnabledResearchTuningReceipt.status ?? null,
        research_escalation:
          recognizerRetentionEnabledResearchTuningReceipt.research_escalation
            ?? null,
        research_conclusion:
          recognizerRetentionEnabledResearchTuningReceipt.research_conclusion
            ?? null,
        boundaries:
          recognizerRetentionEnabledResearchTuningReceipt.boundaries ?? null,
        next_action:
          recognizerRetentionEnabledResearchTuningReceipt.next_action ?? null,
      },
      recognizer_run9_retention_enabled_run6_recipe_preflight: {
        status:
          recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.status
            ?? null,
        dryrun_result:
          recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
            .dryrun_result ?? null,
        future_run9_envelope:
          recognizerRun9RetentionEnabledRun6RecipePreflightReceipt
            .future_run9_envelope ?? null,
        decision:
          recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.decision
            ?? null,
        boundaries:
          recognizerRun9RetentionEnabledRun6RecipePreflightReceipt.boundaries
            ?? null,
      },
      recognizer_run9_brev_auth_visibility_refresh: {
        status:
          recognizerRun9BrevAuthVisibilityRefreshReceipt.status ?? null,
        command:
          recognizerRun9BrevAuthVisibilityRefreshReceipt.command ?? null,
        visibility_result:
          recognizerRun9BrevAuthVisibilityRefreshReceipt.visibility_result
            ?? null,
        decision:
          recognizerRun9BrevAuthVisibilityRefreshReceipt.decision ?? null,
        boundaries:
          recognizerRun9BrevAuthVisibilityRefreshReceipt.boundaries ?? null,
      },
      recognizer_run9_brev_auth_visibility_retry: {
        status:
          recognizerRun9BrevAuthVisibilityRetryReceipt.status ?? null,
        command:
          recognizerRun9BrevAuthVisibilityRetryReceipt.command ?? null,
        visibility_result:
          recognizerRun9BrevAuthVisibilityRetryReceipt.visibility_result
            ?? null,
        decision:
          recognizerRun9BrevAuthVisibilityRetryReceipt.decision ?? null,
        boundaries:
          recognizerRun9BrevAuthVisibilityRetryReceipt.boundaries ?? null,
      },
      recognizer_run9_brev_auth_human_login_boundary: {
        status:
          recognizerRun9BrevAuthHumanLoginBoundaryReceipt.status ?? null,
        latest_probe:
          recognizerRun9BrevAuthHumanLoginBoundaryReceipt.latest_probe
            ?? null,
        visibility_result:
          recognizerRun9BrevAuthHumanLoginBoundaryReceipt.visibility_result
            ?? null,
        decision:
          recognizerRun9BrevAuthHumanLoginBoundaryReceipt.decision ?? null,
        boundaries:
          recognizerRun9BrevAuthHumanLoginBoundaryReceipt.boundaries ?? null,
      },
      landmark_retrain_local_preflight: landmarkRetrainLocalPreflight,
      brev_readiness_refresh: brevReadinessRefresh,
      brev_approval_request: brevApprovalRequest,
      brev_approval_blocker: brevApprovalBlocker,
      codex_supervisor_dry_run: codexSupervisorDryRun,
      codex_both_dry_run: codexBothDryRun,
      landmark_crop_quality_bottleneck: landmarkCropQualityBottleneck,
      landmark_relabel_candidate_backlog: landmarkRelabelCandidateBacklog,
      landmark_oob_mask_policy_probe: landmarkOobMaskPolicyProbe,
      landmark_crop_context_geometry_probe: landmarkCropContextGeometryProbe,
      landmark_targeted_relabel_queue: landmarkTargetedRelabelQueue,
      landmark_targeted_relabel_smoke: landmarkTargetedRelabelSmoke,
      landmark_targeted_relabel_acceptance_diagnostic:
        landmarkTargetedRelabelAcceptanceDiagnostic,
      landmark_frame_edge_cache_policy_decision:
        landmarkFrameEdgeCachePolicyDecision,
      landmark_frame_edge_disposition_manifest: landmarkFrameEdgeDispositionManifest
        ? {
            path: frameEdgeDispositionManifestPath,
            status: "full_backlog_manifest_recorded",
            scope: landmarkFrameEdgeDispositionManifest.scope,
            summary: landmarkFrameEdgeDispositionManifest.summary,
            disposition_counts:
              landmarkFrameEdgeDispositionManifest.summary?.disposition_counts ?? null,
            next_action: landmarkFrameEdgeDispositionManifest.next_action,
          }
        : null,
      landmark_frame_edge_exclusion_seed: landmarkFrameEdgeExclusionSeed
        ? {
            path: frameEdgeExclusionSeedPath,
            status: "selected_only_frame_edge_rows_committed_excluded",
            source_manifest: landmarkFrameEdgeExclusionSeed.source_manifest,
            summary: landmarkFrameEdgeExclusionSeed.summary,
            runtime_boundary: landmarkFrameEdgeExclusionSeed.runtime_boundary,
            next_action: landmarkFrameEdgeExclusionSeed.next_action,
          }
        : null,
      landmark_clearer_source_review_subset: landmarkClearerSourceReviewSubset
        ? {
            path: clearerSourceReviewSubsetPath,
            status: "bounded_clearer_source_review_subset_selected",
            selection_policy: landmarkClearerSourceReviewSubset.selection_policy,
            summary: landmarkClearerSourceReviewSubset.summary,
            runtime_boundary: landmarkClearerSourceReviewSubset.runtime_boundary,
            next_action: landmarkClearerSourceReviewSubset.next_action,
          }
        : null,
      landmark_clearer_source_review_outcomes: landmarkClearerSourceReviewOutcomes
        ? {
            path: clearerSourceReviewOutcomesPath,
            status: "fail_closed_review_outcomes_preservation_validated",
            source_subset: landmarkClearerSourceReviewOutcomes.source_subset,
            summary: landmarkClearerSourceReviewOutcomes.summary,
            validation: landmarkClearerSourceReviewOutcomes.validation,
            preservation_contract: landmarkClearerSourceReviewOutcomes.preservation_contract,
            allowed_reviewer_decisions:
              landmarkClearerSourceReviewOutcomes.allowed_reviewer_decisions,
            required_fields_for_cache_safe_replacement:
              landmarkClearerSourceReviewOutcomes.required_fields_for_cache_safe_replacement,
            required_fields_for_explicit_exclusion:
              landmarkClearerSourceReviewOutcomes.required_fields_for_explicit_exclusion,
            runtime_boundary: landmarkClearerSourceReviewOutcomes.runtime_boundary,
            next_action: landmarkClearerSourceReviewOutcomes.next_action,
          }
        : null,
      landmark_clearer_source_review_packet: landmarkClearerSourceReviewPacket
        ? {
            path: clearerSourceReviewPacketPath,
            status: "metadata_only_review_packet_recorded",
            source_outcome_ledger: landmarkClearerSourceReviewPacket.source_outcome_ledger,
            summary: landmarkClearerSourceReviewPacket.summary,
            reviewer_protocol: landmarkClearerSourceReviewPacket.reviewer_protocol,
            selection_policy: landmarkClearerSourceReviewPacket.selection_policy,
            runtime_boundary: landmarkClearerSourceReviewPacket.runtime_boundary,
            next_action: landmarkClearerSourceReviewPacket.next_action,
          }
        : null,
      pair_ranking_target_support: targetSelectedProbe.schema_version
        ? {
            selected_receipt: rel(sideReceipts.pairRankerTargetsValSelect),
            selected_weights: rel(sideReceipts.pairRankerTargetsValSelectWeights),
            diagnostic_receipt: targetProbe.schema_version ? rel(sideReceipts.pairRankerTargetsTop20) : null,
            status: "selected_fail_closed_not_gate_passing",
            params: {
              topk: targetSelectedProbe.params?.topk ?? null,
              epochs: targetSelectedProbe.params?.epochs ?? null,
              max_train_rows: targetSelectedProbe.params?.max_train_rows ?? null,
              box_quality_target_weight: targetSelectedProbe.params?.box_quality_target_weight ?? null,
              slot_margin_target_weight: targetSelectedProbe.params?.slot_margin_target_weight ?? null,
              hard_negative_target_penalty: targetSelectedProbe.params?.hard_negative_target_penalty ?? null,
              hard_negative_bce_weight: targetSelectedProbe.params?.hard_negative_bce_weight ?? null,
              select_by_validation: targetSelectedProbe.params?.select_by_validation ?? null,
              eval_every: targetSelectedProbe.params?.eval_every ?? null,
            },
            validation_selection: {
              score: targetSelectedProbe.validation_selection?.selection_score ?? null,
              best: targetSelectedProbe.validation_selection?.best ?? null,
            },
            validation: selectedPairMetrics(targetSelectedProbe, "validation"),
            test: selectedPairMetrics(targetSelectedProbe, "test"),
            real_twohand: selectedPairMetrics(targetSelectedProbe, "real_twohand"),
            real_pair_counts: targetSelectedProbe.pair_counts?.real_twohand ?? null,
            previous_best_crop_pose: {
              receipt: rel(sideReceipts.pairRankerCropPose),
              coverage: round(rankerSelected.coverage),
              distinct_assigned_coverage: round(rankerSelected.distinct_assigned_coverage),
              collapse_rate: round(rankerSelected.collapse_rate),
            },
            selection_reason:
              "Validation-selected target ranking ties the current crop/pose ranker distinct assignment while improving coverage, but it remains far below the 0.98 distinct-assignment gate.",
            target_schema: targetSelectedProbe.target_schema ?? null,
          }
        : targetProbe.schema_version
          ? {
              receipt: rel(sideReceipts.pairRankerTargetsTop20),
              status: "diagnostic_not_selected",
              real_twohand: selectedPairMetrics(targetProbe, "real_twohand"),
              selection_reason:
                "Target-weighted real distinct assignment is below the current crop/pose ranker best, so the probe is not selected.",
              target_schema: targetProbe.target_schema ?? null,
          }
          : null,
      candidate_generation_oracle_sweep: candidateOracleSweep.schema_version
        ? {
            receipt: rel(sideReceipts.candidateOracleSweep),
            status: "failed_open_current_head_candidate_ceiling_below_gate",
            params: candidateOracleSweep.params ?? null,
            best: {
              nms_iou: candidateOracleSweep.best?.nms_iou ?? null,
              topk: candidateOracleSweep.best?.topk ?? null,
              coverage: round(candidateOracleSweep.best?.metrics?.coverage),
              distinct_assigned_coverage: round(
                candidateOracleSweep.best?.metrics?.distinct_assigned_coverage,
              ),
              collapse_rate: round(candidateOracleSweep.best?.metrics?.collapse_rate),
              coverage_failure_count: candidateOracleSweep.best?.metrics?.coverage_failure_count ?? null,
              distinct_assignment_failure_count:
                candidateOracleSweep.best?.metrics?.distinct_assignment_failure_count ?? null,
            },
            summary: Array.isArray(candidateOracleSweep.summary)
              ? candidateOracleSweep.summary.map((row) => ({
                  nms_iou: row.nms_iou,
                  topk: row.topk,
                  coverage: round(row.coverage),
                  distinct_assigned_coverage: round(row.distinct_assigned_coverage),
                  collapse_rate: round(row.collapse_rate),
                }))
              : [],
            selection_reason:
              "Widening the current detector candidate pool improves strict oracle distinct assignment from top-20 0.928571 to 0.964286 at top-40+, but still misses the 0.98 gate.",
          }
        : null,
      candidate_repair_targets: candidateRepairTargets.schema_version
        ? {
            receipt: rel(sideReceipts.candidateRepairTargets),
            contact_sheet: exists(sideReceipts.candidateRepairContactSheet)
              ? rel(sideReceipts.candidateRepairContactSheet)
              : null,
            status: "prepared_fail_closed_not_gate_passing",
            params: candidateRepairTargets.params ?? null,
            oracle_metrics: candidateRepairTargets.oracle_metrics
              ? {
                  coverage: round(candidateRepairTargets.oracle_metrics.coverage),
                  distinct_assigned_coverage: round(
                    candidateRepairTargets.oracle_metrics.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(candidateRepairTargets.oracle_metrics.collapse_rate),
                  coverage_failure_count: candidateRepairTargets.oracle_metrics.coverage_failure_count ?? null,
                  distinct_assignment_failure_count:
                    candidateRepairTargets.oracle_metrics.distinct_assignment_failure_count ?? null,
                }
              : null,
            target_count: candidateRepairTargets.target_count ?? null,
            source_indices: candidateRepairTargets.source_indices ?? [],
            repair_tags: Array.isArray(candidateRepairTargets.targets)
              ? candidateRepairTargets.targets.map((target) => ({
                  source_index: target.source_index,
                  split: target.row?.split ?? null,
                  label_id: target.row?.label_id ?? null,
                  video_frame_index: target.row?.video_frame_index ?? null,
                  tags: target.repair_tags ?? [],
                  best_candidate_iou_by_gt: Array.isArray(target.best_candidate_by_gt)
                    ? target.best_candidate_by_gt.map((entry) => round(entry.best_iou))
                    : [],
                }))
              : [],
            selection_reason:
              "These are the three test-split real two-hand source rows the current proposal head still misses even under strict top-40/NMS0.5 oracle pairing; use them as failure patterns and review targets, not as direct train rows without a split/source decision.",
          }
        : null,
      candidate_no_leak_analogs: candidateNoLeakAnalogs.schema_version
        ? {
            receipt: rel(sideReceipts.candidateNoLeakAnalogs),
            contact_sheet: exists(sideReceipts.candidateNoLeakAnalogsContactSheet)
              ? rel(sideReceipts.candidateNoLeakAnalogsContactSheet)
              : null,
            status: "prepared_no_leak_train_validation_near_misses_not_gate_passing",
            params: candidateNoLeakAnalogs.params ?? null,
            oracle_metrics: candidateNoLeakAnalogs.oracle_metrics
              ? {
                  coverage: round(candidateNoLeakAnalogs.oracle_metrics.coverage),
                  distinct_assigned_coverage: round(
                    candidateNoLeakAnalogs.oracle_metrics.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(candidateNoLeakAnalogs.oracle_metrics.collapse_rate),
                  coverage_failure_count: candidateNoLeakAnalogs.oracle_metrics.coverage_failure_count ?? null,
                  distinct_assignment_failure_count:
                    candidateNoLeakAnalogs.oracle_metrics.distinct_assignment_failure_count ?? null,
                }
              : null,
            target_count: candidateNoLeakAnalogs.target_count ?? null,
            target_counts_by_kind: candidateNoLeakAnalogs.target_counts_by_kind ?? {},
            target_counts_by_split: candidateNoLeakAnalogs.target_counts_by_split ?? {},
            source_indices: candidateNoLeakAnalogs.source_indices ?? [],
            repair_tags: Array.isArray(candidateNoLeakAnalogs.targets)
              ? candidateNoLeakAnalogs.targets.map((target) => ({
                  source_index: target.source_index,
                  split: target.row?.split ?? null,
                  label_id: target.row?.label_id ?? null,
                  video_frame_index: target.row?.video_frame_index ?? null,
                  target_kind: target.target_kind ?? null,
                  min_best_candidate_iou: round(target.min_best_candidate_iou),
                  tags: target.repair_tags ?? [],
                  recommended_use: target.recommended_use ?? null,
                }))
              : [],
            selection_reason:
              "Train+validation have no direct current-head oracle failures at top-40/NMS0.5, but one train and five validation near-miss analogs below min-best IoU 0.55 can guide no-leak proposal-head repair.",
          }
        : null,
      candidate_no_leak_analog_expansion_t065: candidateNoLeakAnalogsT065.schema_version
        ? {
            receipt: rel(sideReceipts.candidateNoLeakAnalogsT065),
            contact_sheet: exists(sideReceipts.candidateNoLeakAnalogsT065ContactSheet)
              ? rel(sideReceipts.candidateNoLeakAnalogsT065ContactSheet)
              : null,
            status: "prepared_expanded_no_leak_near_misses_not_gate_passing",
            params: candidateNoLeakAnalogsT065.params ?? null,
            oracle_metrics: candidateNoLeakAnalogsT065.oracle_metrics
              ? {
                  coverage: round(candidateNoLeakAnalogsT065.oracle_metrics.coverage),
                  distinct_assigned_coverage: round(
                    candidateNoLeakAnalogsT065.oracle_metrics.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(candidateNoLeakAnalogsT065.oracle_metrics.collapse_rate),
                  coverage_failure_count:
                    candidateNoLeakAnalogsT065.oracle_metrics.coverage_failure_count ?? null,
                  distinct_assignment_failure_count:
                    candidateNoLeakAnalogsT065.oracle_metrics.distinct_assignment_failure_count ?? null,
                }
              : null,
            target_count: candidateNoLeakAnalogsT065.target_count ?? null,
            target_counts_by_kind: candidateNoLeakAnalogsT065.target_counts_by_kind ?? {},
            target_counts_by_split: candidateNoLeakAnalogsT065.target_counts_by_split ?? {},
            source_indices: candidateNoLeakAnalogsT065.source_indices ?? [],
            repair_tags: Array.isArray(candidateNoLeakAnalogsT065.targets)
              ? candidateNoLeakAnalogsT065.targets.map((target) => ({
                  source_index: target.source_index,
                  split: target.row?.split ?? null,
                  label_id: target.row?.label_id ?? null,
                  video_frame_index: target.row?.video_frame_index ?? null,
                  target_kind: target.target_kind ?? null,
                  min_best_candidate_iou: round(target.min_best_candidate_iou),
                  tags: target.repair_tags ?? [],
                  recommended_use: target.recommended_use ?? null,
                }))
              : [],
            selection_reason:
              "Raising the near-miss threshold to 0.65 expands no-leak repair pressure from one train analog to seven train analogs plus nine validation monitors while keeping all rows eval-only until an explicit training probe consumes train rows only.",
          }
        : null,
      proposal_train_analog_probe: proposalTrainAnalogProbe.schema_version
        ? {
            receipt: rel(sideReceipts.proposalTrainAnalogProbe),
            weights: exists(sideReceipts.proposalTrainAnalogWeights)
              ? rel(sideReceipts.proposalTrainAnalogWeights)
              : null,
            render: exists(sideReceipts.proposalTrainAnalogRender)
              ? rel(sideReceipts.proposalTrainAnalogRender)
              : null,
            failure_render: exists(sideReceipts.proposalTrainAnalogFailures)
              ? rel(sideReceipts.proposalTrainAnalogFailures)
              : null,
            status: "rejected_validation_selected_no_improvement_not_gate_passing",
            params: {
              epochs: proposalTrainAnalogProbe.epochs ?? null,
              lr: 0.0001,
              oversample_hard_targets: proposalTrainAnalogProbe.oversample_hard_targets ?? null,
              init_weights: proposalTrainAnalogProbe.init_weights ?? null,
              data: "tools/detector0-annotator/.cache/autolabel-big",
              decode_nms_iou: proposalTrainAnalogProbe.real_twohand_eval?.decode_nms_iou ?? null,
              coverage_iou: proposalTrainAnalogProbe.real_twohand_eval?.coverage_iou ?? null,
            },
            validation: {
              initial_val_loss: proposalTrainAnalogProbe.initial_val_loss ?? null,
              best_val_loss: proposalTrainAnalogProbe.best_val_loss ?? null,
              final_validation_loss: proposalTrainAnalogProbe.validation?.loss ?? null,
              final_test_loss: proposalTrainAnalogProbe.test?.loss ?? null,
            },
            hard_target_manifest: proposalTrainAnalogProbe.hard_target_manifest ?? null,
            real_twohand_new: {
              coverage: round(proposalTrainAnalogProbe.real_twohand_eval?.new?.coverage),
              distinct_assigned_coverage: round(
                proposalTrainAnalogProbe.real_twohand_eval?.new?.distinct_assigned_coverage,
              ),
              collapse_rate: round(proposalTrainAnalogProbe.real_twohand_eval?.new?.collapse_rate),
              coverage_failure_count:
                proposalTrainAnalogProbe.real_twohand_eval?.new?.coverage_failure_count ?? null,
              distinct_assignment_failure_count:
                proposalTrainAnalogProbe.real_twohand_eval?.new?.distinct_assignment_failure_count ?? null,
            },
            selection_reason:
              "One train-split near-miss oversampled 40x did not beat the warm-start validation loss and did not improve real two-hand distinct assignment, so the emitted weights remain rejected and fail-closed.",
          }
        : null,
      proposal_train_analog_t065_probe: proposalTrainAnalogT065Probe.schema_version
        ? {
            receipt: rel(sideReceipts.proposalTrainAnalogT065Probe),
            weights: exists(sideReceipts.proposalTrainAnalogT065Weights)
              ? rel(sideReceipts.proposalTrainAnalogT065Weights)
              : null,
            render: exists(sideReceipts.proposalTrainAnalogT065Render)
              ? rel(sideReceipts.proposalTrainAnalogT065Render)
              : null,
            failure_render: exists(sideReceipts.proposalTrainAnalogT065Failures)
              ? rel(sideReceipts.proposalTrainAnalogT065Failures)
              : null,
            status: "rejected_validation_selected_no_improvement_not_gate_passing",
            params: {
              epochs: proposalTrainAnalogT065Probe.epochs ?? null,
              lr: 0.0001,
              oversample_hard_targets: proposalTrainAnalogT065Probe.oversample_hard_targets ?? null,
              init_weights: proposalTrainAnalogT065Probe.init_weights ?? null,
              data: "tools/detector0-annotator/.cache/autolabel-big",
              decode_nms_iou: proposalTrainAnalogT065Probe.real_twohand_eval?.decode_nms_iou ?? null,
              coverage_iou: proposalTrainAnalogT065Probe.real_twohand_eval?.coverage_iou ?? null,
            },
            validation: {
              initial_val_loss: proposalTrainAnalogT065Probe.initial_val_loss ?? null,
              best_val_loss: proposalTrainAnalogT065Probe.best_val_loss ?? null,
              final_validation_loss: proposalTrainAnalogT065Probe.validation?.loss ?? null,
              final_test_loss: proposalTrainAnalogT065Probe.test?.loss ?? null,
            },
            hard_target_manifest: proposalTrainAnalogT065Probe.hard_target_manifest ?? null,
            real_twohand_new: {
              coverage: round(proposalTrainAnalogT065Probe.real_twohand_eval?.new?.coverage),
              distinct_assigned_coverage: round(
                proposalTrainAnalogT065Probe.real_twohand_eval?.new?.distinct_assigned_coverage,
              ),
              collapse_rate: round(proposalTrainAnalogT065Probe.real_twohand_eval?.new?.collapse_rate),
              coverage_failure_count:
                proposalTrainAnalogT065Probe.real_twohand_eval?.new?.coverage_failure_count ?? null,
              distinct_assignment_failure_count:
                proposalTrainAnalogT065Probe.real_twohand_eval?.new?.distinct_assignment_failure_count ?? null,
            },
            selection_reason:
              "Seven train-split near-misses oversampled 20x still did not beat the warm-start validation loss and did not improve real two-hand distinct assignment, so simple no-leak oversampling remains rejected.",
          }
        : null,
      subproposal_oracle: subproposalOracle.schema_version
        ? {
            receipt: rel(sideReceipts.subproposalOracle),
            status: "oracle_passed_not_trainable_without_model",
            params: subproposalOracle.params ?? null,
            base_oracle_metrics: subproposalOracle.base_oracle_metrics
              ? {
                  coverage: round(subproposalOracle.base_oracle_metrics.coverage),
                  distinct_assigned_coverage: round(
                    subproposalOracle.base_oracle_metrics.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(subproposalOracle.base_oracle_metrics.collapse_rate),
                  coverage_failure_count:
                    subproposalOracle.base_oracle_metrics.coverage_failure_count ?? null,
                  distinct_assignment_failure_count:
                    subproposalOracle.base_oracle_metrics.distinct_assignment_failure_count ?? null,
                }
              : null,
            subproposal_oracle_metrics: subproposalOracle.subproposal_oracle_metrics
              ? {
                  coverage: round(subproposalOracle.subproposal_oracle_metrics.coverage),
                  distinct_assigned_coverage: round(
                    subproposalOracle.subproposal_oracle_metrics.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(subproposalOracle.subproposal_oracle_metrics.collapse_rate),
                  coverage_failure_count:
                    subproposalOracle.subproposal_oracle_metrics.coverage_failure_count ?? null,
                  distinct_assignment_failure_count:
                    subproposalOracle.subproposal_oracle_metrics.distinct_assignment_failure_count ?? null,
                }
              : null,
            recovered_rows: subproposalOracle.recovered_rows ?? [],
            regressed_rows: subproposalOracle.regressed_rows ?? [],
            selection_reason:
              "Deterministic sub-box proposals raise the strict current-head oracle from 0.964286 to 0.988095 distinct assignment with no regressions, recovering held-out rows 12328 and 12329; this supports a trainable second-stage subproposal head but is not itself a model.",
          }
        : null,
      trainable_subproposal_ranker: subproposalRankerGeom.schema_version
        ? {
            receipt: rel(sideReceipts.subproposalRankerGeom),
            weights: rel(sideReceipts.subproposalRankerGeomWeights),
            status: "rejected_geometry_only_not_gate_passing_not_promoted",
            params: subproposalRankerGeom.params ?? null,
            subproposal_training: subproposalRankerGeom.subproposal_training ?? null,
            validation_selected_metrics: subproposalRankerGeom.validation?.selected
              ? {
                  coverage: round(subproposalRankerGeom.validation.selected.coverage),
                  distinct_assigned_coverage: round(
                    subproposalRankerGeom.validation.selected.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(subproposalRankerGeom.validation.selected.collapse_rate),
                }
              : null,
            real_twohand_selected_metrics: subproposalRankerGeom.real_twohand?.selected
              ? {
                  coverage: round(subproposalRankerGeom.real_twohand.selected.coverage),
                  distinct_assigned_coverage: round(
                    subproposalRankerGeom.real_twohand.selected.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(subproposalRankerGeom.real_twohand.selected.collapse_rate),
                  coverage_failure_count:
                    subproposalRankerGeom.real_twohand.selected.coverage_failure_count ?? null,
                  distinct_assignment_failure_count:
                    subproposalRankerGeom.real_twohand.selected
                      .distinct_assignment_failure_count ?? null,
                }
              : null,
            real_twohand_oracle_metrics: subproposalRankerGeom.real_twohand?.oracle
              ? {
                  coverage: round(subproposalRankerGeom.real_twohand.oracle.coverage),
                  distinct_assigned_coverage: round(
                    subproposalRankerGeom.real_twohand.oracle.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(subproposalRankerGeom.real_twohand.oracle.collapse_rate),
                }
              : null,
            selection_reason:
              "The trainable geometry-only subproposal ranker proves the training path but is rejected: real two-hand selected distinct assignment is 0.630952 with collapse 0.130952 while the same candidate set oracle remains 0.988095, so the next repair needs normalized crop/pose evidence or a different candidate-level head.",
          }
        : null,
      crop_pose_subproposal_ranker: subproposalRankerCropPose.schema_version
        ? {
            receipt: rel(sideReceipts.subproposalRankerCropPose),
            weights: rel(sideReceipts.subproposalRankerCropPoseWeights),
            status: "rejected_pairwise_crop_pose_not_gate_passing_not_promoted",
            params: subproposalRankerCropPose.params ?? null,
            landmark_feature_source: subproposalRankerCropPose.landmark_feature_source ?? null,
            subproposal_training: subproposalRankerCropPose.subproposal_training ?? null,
            validation_selected_metrics: subproposalRankerCropPose.validation?.selected
              ? {
                  coverage: round(subproposalRankerCropPose.validation.selected.coverage),
                  distinct_assigned_coverage: round(
                    subproposalRankerCropPose.validation.selected.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(subproposalRankerCropPose.validation.selected.collapse_rate),
                }
              : null,
            real_twohand_selected_metrics: subproposalRankerCropPose.real_twohand?.selected
              ? {
                  coverage: round(subproposalRankerCropPose.real_twohand.selected.coverage),
                  distinct_assigned_coverage: round(
                    subproposalRankerCropPose.real_twohand.selected
                      .distinct_assigned_coverage,
                  ),
                  collapse_rate: round(subproposalRankerCropPose.real_twohand.selected.collapse_rate),
                  coverage_failure_count:
                    subproposalRankerCropPose.real_twohand.selected.coverage_failure_count ?? null,
                  distinct_assignment_failure_count:
                    subproposalRankerCropPose.real_twohand.selected
                      .distinct_assignment_failure_count ?? null,
                }
              : null,
            real_twohand_oracle_metrics: subproposalRankerCropPose.real_twohand?.oracle
              ? {
                  coverage: round(subproposalRankerCropPose.real_twohand.oracle.coverage),
                  distinct_assigned_coverage: round(
                    subproposalRankerCropPose.real_twohand.oracle.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(subproposalRankerCropPose.real_twohand.oracle.collapse_rate),
                }
              : null,
            selection_reason:
              "Adding owned crop/pose features to the pairwise subproposal ranker still fails: real two-hand selected distinct assignment drops to 0.607143 with collapse 0.154762 while the same candidate set oracle remains 0.988095. The next repair should stop pairwise ranker tweaks and test a candidate-level second-stage proposal head.",
          }
        : null,
      candidate_level_subproposal_head: candidateHeadCropPose.schema_version
        ? {
            receipt: rel(sideReceipts.candidateHeadCropPose),
            weights: rel(sideReceipts.candidateHeadCropPoseWeights),
            status: "rejected_candidate_level_head_not_gate_passing_not_promoted",
            params: candidateHeadCropPose.params ?? null,
            landmark_feature_source: candidateHeadCropPose.landmark_feature_source ?? null,
            subproposal_training: candidateHeadCropPose.subproposal_training ?? null,
            validation_selection: {
              score: candidateHeadCropPose.validation_selection?.selection_score ?? null,
              best: candidateHeadCropPose.validation_selection?.best ?? null,
            },
            candidate_counts: candidateHeadCropPose.candidate_counts ?? null,
            validation_selected_metrics: candidateHeadCropPose.validation?.selected
              ? {
                  coverage: round(candidateHeadCropPose.validation.selected.coverage),
                  distinct_assigned_coverage: round(
                    candidateHeadCropPose.validation.selected.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(candidateHeadCropPose.validation.selected.collapse_rate),
                }
              : null,
            real_twohand_selected_metrics: candidateHeadCropPose.real_twohand?.selected
              ? {
                  coverage: round(candidateHeadCropPose.real_twohand.selected.coverage),
                  distinct_assigned_coverage: round(
                    candidateHeadCropPose.real_twohand.selected.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(candidateHeadCropPose.real_twohand.selected.collapse_rate),
                  coverage_failure_count:
                    candidateHeadCropPose.real_twohand.selected.coverage_failure_count ?? null,
                  distinct_assignment_failure_count:
                    candidateHeadCropPose.real_twohand.selected.distinct_assignment_failure_count ?? null,
                }
              : null,
            real_twohand_oracle_metrics: candidateHeadCropPose.real_twohand?.oracle
              ? {
                  coverage: round(candidateHeadCropPose.real_twohand.oracle.coverage),
                  distinct_assigned_coverage: round(
                    candidateHeadCropPose.real_twohand.oracle.distinct_assigned_coverage,
                  ),
                  collapse_rate: round(candidateHeadCropPose.real_twohand.oracle.collapse_rate),
                }
              : null,
            selection_reason:
              "The candidate-level crop/pose subproposal head suppresses collapse but is rejected: real two-hand selected distinct assignment is 0.380952 while the same candidate set oracle remains 0.988095. The next repair should audit selector failure modes before adding another training head.",
          }
        : null,
      candidate_selection_failure_audit: candidateSelectionFailureAudit.schema_version
        ? {
            receipt: rel(sideReceipts.candidateSelectionFailureAudit),
            contact_sheet: rel(sideReceipts.candidateSelectionFailureContactSheet),
            status: candidateSelectionFailureAudit.selection?.gate_status ?? null,
            metrics: candidateSelectionFailureAudit.metrics ?? null,
            summary: candidateSelectionFailureAudit.summary ?? null,
            runtime_boundary: candidateSelectionFailureAudit.runtime_boundary ?? null,
            selection_reason: candidateSelectionFailureAudit.selection?.reason ?? null,
          }
        : null,
      pairrank_selector_objective_repair: pairRankObjectiveReceipt.schema_version
        ? {
            receipt: rel(pairRankObjectiveReceiptFilePath),
            status: pairRankObjectiveReceipt.status ?? null,
            code: pairRankObjectiveReceipt.code ?? null,
            local_smoke: candidateHeadPairRankSmoke.schema_version
              ? {
                  receipt: rel(sideReceipts.candidateHeadPairRankSmoke),
                  weights: rel(sideReceipts.candidateHeadPairRankSmokeWeights),
                  params: candidateHeadPairRankSmoke.params ?? null,
                  validation_selection: candidateHeadPairRankSmoke.validation_selection?.best ?? null,
                  real_twohand_selected_metrics: candidateHeadPairRankSmoke.real_twohand?.selected
                    ? {
                        coverage: round(candidateHeadPairRankSmoke.real_twohand.selected.coverage),
                        distinct_assigned_coverage: round(
                          candidateHeadPairRankSmoke.real_twohand.selected.distinct_assigned_coverage,
                        ),
                        collapse_rate: round(candidateHeadPairRankSmoke.real_twohand.selected.collapse_rate),
                        n: candidateHeadPairRankSmoke.real_twohand.selected.n ?? null,
                      }
                    : null,
                  real_twohand_oracle_metrics: candidateHeadPairRankSmoke.real_twohand?.oracle
                    ? {
                        coverage: round(candidateHeadPairRankSmoke.real_twohand.oracle.coverage),
                        distinct_assigned_coverage: round(
                          candidateHeadPairRankSmoke.real_twohand.oracle.distinct_assigned_coverage,
                        ),
                        collapse_rate: round(candidateHeadPairRankSmoke.real_twohand.oracle.collapse_rate),
                        n: candidateHeadPairRankSmoke.real_twohand.oracle.n ?? null,
                      }
                    : null,
                }
              : null,
            full_scope_brev: candidateHeadPairRankFullBrev.schema_version
              ? {
                  receipt: rel(sideReceipts.candidateHeadPairRankFullBrev),
                  weights: rel(sideReceipts.candidateHeadPairRankFullBrevWeights),
                  params: candidateHeadPairRankFullBrev.params ?? null,
                  candidate_counts: candidateHeadPairRankFullBrev.candidate_counts ?? null,
                  validation_selection: candidateHeadPairRankFullBrev.validation_selection?.best ?? null,
                  real_twohand_selected_metrics: candidateHeadPairRankFullBrev.real_twohand?.selected
                    ? {
                        coverage: round(
                          candidateHeadPairRankFullBrev.real_twohand.selected.coverage,
                        ),
                        distinct_assigned_coverage: round(
                          candidateHeadPairRankFullBrev.real_twohand.selected
                            .distinct_assigned_coverage,
                        ),
                        collapse_rate: round(
                          candidateHeadPairRankFullBrev.real_twohand.selected.collapse_rate,
                        ),
                        decoded_two_distinct: round(
                          candidateHeadPairRankFullBrev.real_twohand.selected.decoded_two_distinct,
                        ),
                        n: candidateHeadPairRankFullBrev.real_twohand.selected.n ?? null,
                      }
                    : null,
                  real_twohand_oracle_metrics: candidateHeadPairRankFullBrev.real_twohand?.oracle
                    ? {
                        coverage: round(candidateHeadPairRankFullBrev.real_twohand.oracle.coverage),
                        distinct_assigned_coverage: round(
                          candidateHeadPairRankFullBrev.real_twohand.oracle
                            .distinct_assigned_coverage,
                        ),
                        collapse_rate: round(
                          candidateHeadPairRankFullBrev.real_twohand.oracle.collapse_rate,
                        ),
                        n: candidateHeadPairRankFullBrev.real_twohand.oracle.n ?? null,
                      }
                    : null,
                  selection: candidateHeadPairRankFullBrev.selection ?? null,
                }
              : null,
            full_scope_failure_audit: candidateHeadPairRankFullBrevFailureAudit.schema_version
              ? {
                  receipt: rel(sideReceipts.candidateHeadPairRankFullBrevFailureAudit),
                  contact_sheet: rel(sideReceipts.candidateHeadPairRankFullBrevFailureContactSheet),
                  summary: candidateHeadPairRankFullBrevFailureAudit.summary ?? null,
                  selection: candidateHeadPairRankFullBrevFailureAudit.selection ?? null,
                  runtime_boundary:
                    candidateHeadPairRankFullBrevFailureAudit.runtime_boundary ?? null,
                }
              : null,
            brev_full_scope_attempt: pairRankObjectiveReceipt.brev_full_scope_attempt ?? null,
            runtime_boundary: pairRankObjectiveReceipt.runtime_boundary ?? null,
            next_action: pairRankObjectiveReceipt.next_action ?? null,
          }
        : null,
      pairmargin_selector_repair: pairMarginSelectorRepairReceipt.schema_version
        ? {
            receipt: rel(pairMarginSelectorRepairReceiptFilePath),
            status: pairMarginSelectorRepairReceipt.status ?? null,
            code: pairMarginSelectorRepairReceipt.code ?? null,
            local_smoke: candidateHeadPairMarginSmoke.schema_version
              ? {
                  receipt: rel(sideReceipts.candidateHeadPairMarginSmoke),
                  weights: rel(sideReceipts.candidateHeadPairMarginSmokeWeights),
                  params: candidateHeadPairMarginSmoke.params ?? null,
                  validation_selection: candidateHeadPairMarginSmoke.validation_selection?.best ?? null,
                  real_twohand_selected_metrics: candidateHeadPairMarginSmoke.real_twohand?.selected
                    ? {
                        coverage: round(candidateHeadPairMarginSmoke.real_twohand.selected.coverage),
                        distinct_assigned_coverage: round(
                          candidateHeadPairMarginSmoke.real_twohand.selected
                            .distinct_assigned_coverage,
                        ),
                        collapse_rate: round(
                          candidateHeadPairMarginSmoke.real_twohand.selected.collapse_rate,
                        ),
                        n: candidateHeadPairMarginSmoke.real_twohand.selected.n ?? null,
                      }
                    : null,
                }
              : null,
            full_scope_brev: candidateHeadPairMarginFullBrev.schema_version
              ? {
                  receipt: rel(sideReceipts.candidateHeadPairMarginFullBrev),
                  weights: rel(sideReceipts.candidateHeadPairMarginFullBrevWeights),
                  params: candidateHeadPairMarginFullBrev.params ?? null,
                  candidate_counts: candidateHeadPairMarginFullBrev.candidate_counts ?? null,
                  validation_selection: candidateHeadPairMarginFullBrev.validation_selection?.best ?? null,
                  real_twohand_selected_metrics: candidateHeadPairMarginFullBrev.real_twohand?.selected
                    ? {
                        coverage: round(
                          candidateHeadPairMarginFullBrev.real_twohand.selected.coverage,
                        ),
                        distinct_assigned_coverage: round(
                          candidateHeadPairMarginFullBrev.real_twohand.selected
                            .distinct_assigned_coverage,
                        ),
                        collapse_rate: round(
                          candidateHeadPairMarginFullBrev.real_twohand.selected.collapse_rate,
                        ),
                        n: candidateHeadPairMarginFullBrev.real_twohand.selected.n ?? null,
                      }
                    : null,
                  real_twohand_oracle_metrics: candidateHeadPairMarginFullBrev.real_twohand?.oracle
                    ? {
                        coverage: round(candidateHeadPairMarginFullBrev.real_twohand.oracle.coverage),
                        distinct_assigned_coverage: round(
                          candidateHeadPairMarginFullBrev.real_twohand.oracle
                            .distinct_assigned_coverage,
                        ),
                        collapse_rate: round(
                          candidateHeadPairMarginFullBrev.real_twohand.oracle.collapse_rate,
                        ),
                        n: candidateHeadPairMarginFullBrev.real_twohand.oracle.n ?? null,
                      }
                    : null,
                  selection: candidateHeadPairMarginFullBrev.selection ?? null,
                }
              : null,
            full_scope_failure_audit: candidateHeadPairMarginFullBrevFailureAudit.schema_version
              ? {
                  receipt: rel(sideReceipts.candidateHeadPairMarginFullBrevFailureAudit),
                  contact_sheet: rel(sideReceipts.candidateHeadPairMarginFullBrevFailureContactSheet),
                  summary: candidateHeadPairMarginFullBrevFailureAudit.summary ?? null,
                  selection: candidateHeadPairMarginFullBrevFailureAudit.selection ?? null,
                  runtime_boundary:
                    candidateHeadPairMarginFullBrevFailureAudit.runtime_boundary ?? null,
                }
              : null,
            brev_full_scope_run: pairMarginSelectorRepairReceipt.brev_full_scope_run ?? null,
            runtime_boundary: pairMarginSelectorRepairReceipt.runtime_boundary ?? null,
            next_action: pairMarginSelectorRepairReceipt.next_action ?? null,
          }
        : null,
      direct_pair_scorer_probe: directPairScorerReceipt.schema_version
        ? {
            receipt: rel(directPairScorerReceiptFilePath),
            status: directPairScorerReceipt.status ?? null,
            code: directPairScorerReceipt.code ?? null,
            local_smoke: directPairScorerSmoke.schema_version
              ? {
                  receipt: rel(sideReceipts.directPairScorerSmoke),
                  weights: rel(sideReceipts.directPairScorerSmokeWeights),
                  params: directPairScorerSmoke.params ?? null,
                  pair_counts: directPairScorerSmoke.pair_counts ?? null,
                  validation_selection: directPairScorerSmoke.validation_selection?.best ?? null,
                  real_twohand_selected_metrics: directPairScorerSmoke.real_twohand?.selected
                    ? {
                        coverage: round(directPairScorerSmoke.real_twohand.selected.coverage),
                        distinct_assigned_coverage: round(
                          directPairScorerSmoke.real_twohand.selected.distinct_assigned_coverage,
                        ),
                        collapse_rate: round(directPairScorerSmoke.real_twohand.selected.collapse_rate),
                        n: directPairScorerSmoke.real_twohand.selected.n ?? null,
                      }
                    : null,
                  real_twohand_oracle_metrics: directPairScorerSmoke.real_twohand?.oracle
                    ? {
                        coverage: round(directPairScorerSmoke.real_twohand.oracle.coverage),
                        distinct_assigned_coverage: round(
                          directPairScorerSmoke.real_twohand.oracle.distinct_assigned_coverage,
                        ),
                        collapse_rate: round(directPairScorerSmoke.real_twohand.oracle.collapse_rate),
                        n: directPairScorerSmoke.real_twohand.oracle.n ?? null,
                      }
                    : null,
                }
              : null,
            intended_full_scope_brev_run:
              directPairScorerReceipt.intended_full_scope_brev_run ?? null,
            full_scope_brev: directPairScorerFullBrev.schema_version
              ? {
                  receipt: rel(sideReceipts.directPairScorerFullBrev),
                  weights: rel(sideReceipts.directPairScorerFullBrevWeights),
                  params: directPairScorerFullBrev.params ?? null,
                  pair_counts: directPairScorerFullBrev.pair_counts ?? null,
                  validation_selection: directPairScorerFullBrev.validation_selection?.best ?? null,
                  test_selected_metrics: directPairScorerFullBrev.test?.selected
                    ? {
                        coverage: round(directPairScorerFullBrev.test.selected.coverage),
                        distinct_assigned_coverage: round(
                          directPairScorerFullBrev.test.selected.distinct_assigned_coverage,
                        ),
                        collapse_rate: round(directPairScorerFullBrev.test.selected.collapse_rate),
                        n: directPairScorerFullBrev.test.selected.n ?? null,
                      }
                    : null,
                  real_twohand_selected_metrics: directPairScorerFullBrev.real_twohand?.selected
                    ? {
                        coverage: round(directPairScorerFullBrev.real_twohand.selected.coverage),
                        distinct_assigned_coverage: round(
                          directPairScorerFullBrev.real_twohand.selected
                            .distinct_assigned_coverage,
                        ),
                        collapse_rate: round(
                          directPairScorerFullBrev.real_twohand.selected.collapse_rate,
                        ),
                        coverage_failure_count:
                          directPairScorerFullBrev.real_twohand.selected
                            .coverage_failure_count ?? null,
                        distinct_assignment_failure_count:
                          directPairScorerFullBrev.real_twohand.selected
                            .distinct_assignment_failure_count ?? null,
                        n: directPairScorerFullBrev.real_twohand.selected.n ?? null,
                      }
                    : null,
                  real_twohand_oracle_metrics: directPairScorerFullBrev.real_twohand?.oracle
                    ? {
                        coverage: round(directPairScorerFullBrev.real_twohand.oracle.coverage),
                        distinct_assigned_coverage: round(
                          directPairScorerFullBrev.real_twohand.oracle
                            .distinct_assigned_coverage,
                        ),
                        collapse_rate: round(
                          directPairScorerFullBrev.real_twohand.oracle.collapse_rate,
                        ),
                        n: directPairScorerFullBrev.real_twohand.oracle.n ?? null,
                      }
                    : null,
                }
              : null,
            full_scope_brev_run: directPairScorerReceipt.full_scope_brev_run ?? null,
            failure_analysis: directPairScorerReceipt.failure_analysis ?? null,
            brev_cleanup: directPairScorerReceipt.brev_cleanup ?? null,
            runtime_boundary: directPairScorerReceipt.runtime_boundary ?? null,
            selection: directPairScorerReceipt.selection ?? null,
            next_action: directPairScorerReceipt.next_action ?? null,
          }
        : null,
      overlap_aware_assignment_head_repair: assignmentHeadRepairReceipt.schema_version
        ? {
            receipt: rel(assignmentHeadRepairReceiptFilePath),
            status: assignmentHeadRepairReceipt.status ?? null,
            code: assignmentHeadRepairReceipt.code ?? null,
            local_smoke: assignmentHeadRepairReceipt.local_smoke ?? null,
            score_and_loss_full_scope_brev: assignmentHeadFullBrev.schema_version
              ? {
                  receipt: rel(sideReceipts.assignmentHeadFullBrev),
                  weights: rel(sideReceipts.assignmentHeadFullBrevWeights),
                  params: {
                    max_train_rows: assignmentHeadFullBrev.params?.max_train_rows ?? null,
                    epochs: assignmentHeadFullBrev.params?.epochs ?? null,
                    batch_groups: assignmentHeadFullBrev.params?.batch_groups ?? null,
                    subproposal_source_topk:
                      assignmentHeadFullBrev.params?.subproposal_source_topk ?? null,
                    subproposal_max_topk:
                      assignmentHeadFullBrev.params?.subproposal_max_topk ?? null,
                    assignment_head_loss_weight:
                      assignmentHeadFullBrev.params?.assignment_head_loss_weight ?? null,
                    assignment_head_score_weight:
                      assignmentHeadFullBrev.params?.assignment_head_score_weight ?? null,
                    assignment_head_positive_weight:
                      assignmentHeadFullBrev.params?.assignment_head_positive_weight ?? null,
                    assignment_head_overlap_boost:
                      assignmentHeadFullBrev.params?.assignment_head_overlap_boost ?? null,
                  },
                  pair_counts: assignmentHeadFullBrev.pair_counts ?? null,
                  validation_selection: assignmentHeadFullBrev.validation_selection?.best ?? null,
                  real_twohand_selected_metrics: assignmentHeadFullBrev.real_twohand?.selected
                    ? {
                        coverage: round(assignmentHeadFullBrev.real_twohand.selected.coverage),
                        distinct_assigned_coverage: round(
                          assignmentHeadFullBrev.real_twohand.selected
                            .distinct_assigned_coverage,
                        ),
                        collapse_rate: round(
                          assignmentHeadFullBrev.real_twohand.selected.collapse_rate,
                        ),
                        coverage_failure_count:
                          assignmentHeadFullBrev.real_twohand.selected.coverage_failure_count ??
                          null,
                        distinct_assignment_failure_count:
                          assignmentHeadFullBrev.real_twohand.selected
                            .distinct_assignment_failure_count ?? null,
                        n: assignmentHeadFullBrev.real_twohand.selected.n ?? null,
                      }
                    : null,
                  real_twohand_oracle_metrics: assignmentHeadFullBrev.real_twohand?.oracle
                    ? {
                        coverage: round(assignmentHeadFullBrev.real_twohand.oracle.coverage),
                        distinct_assigned_coverage: round(
                          assignmentHeadFullBrev.real_twohand.oracle
                            .distinct_assigned_coverage,
                        ),
                        collapse_rate: round(
                          assignmentHeadFullBrev.real_twohand.oracle.collapse_rate,
                        ),
                        n: assignmentHeadFullBrev.real_twohand.oracle.n ?? null,
                      }
                    : null,
                }
              : null,
            loss_only_full_scope_brev: assignmentHeadLossOnlyFullBrev.schema_version
              ? {
                  receipt: rel(sideReceipts.assignmentHeadLossOnlyFullBrev),
                  weights: rel(sideReceipts.assignmentHeadLossOnlyFullBrevWeights),
                  params: {
                    max_train_rows: assignmentHeadLossOnlyFullBrev.params?.max_train_rows ?? null,
                    epochs: assignmentHeadLossOnlyFullBrev.params?.epochs ?? null,
                    batch_groups: assignmentHeadLossOnlyFullBrev.params?.batch_groups ?? null,
                    subproposal_source_topk:
                      assignmentHeadLossOnlyFullBrev.params?.subproposal_source_topk ?? null,
                    subproposal_max_topk:
                      assignmentHeadLossOnlyFullBrev.params?.subproposal_max_topk ?? null,
                    assignment_head_loss_weight:
                      assignmentHeadLossOnlyFullBrev.params?.assignment_head_loss_weight ?? null,
                    assignment_head_score_weight:
                      assignmentHeadLossOnlyFullBrev.params?.assignment_head_score_weight ?? null,
                    assignment_head_positive_weight:
                      assignmentHeadLossOnlyFullBrev.params?.assignment_head_positive_weight ??
                      null,
                    assignment_head_overlap_boost:
                      assignmentHeadLossOnlyFullBrev.params?.assignment_head_overlap_boost ?? null,
                  },
                  pair_counts: assignmentHeadLossOnlyFullBrev.pair_counts ?? null,
                  validation_selection:
                    assignmentHeadLossOnlyFullBrev.validation_selection?.best ?? null,
                  real_twohand_selected_metrics:
                    assignmentHeadLossOnlyFullBrev.real_twohand?.selected
                      ? {
                          coverage: round(
                            assignmentHeadLossOnlyFullBrev.real_twohand.selected.coverage,
                          ),
                          distinct_assigned_coverage: round(
                            assignmentHeadLossOnlyFullBrev.real_twohand.selected
                              .distinct_assigned_coverage,
                          ),
                          collapse_rate: round(
                            assignmentHeadLossOnlyFullBrev.real_twohand.selected.collapse_rate,
                          ),
                          coverage_failure_count:
                            assignmentHeadLossOnlyFullBrev.real_twohand.selected
                              .coverage_failure_count ?? null,
                          distinct_assignment_failure_count:
                            assignmentHeadLossOnlyFullBrev.real_twohand.selected
                              .distinct_assignment_failure_count ?? null,
                          n: assignmentHeadLossOnlyFullBrev.real_twohand.selected.n ?? null,
                        }
                      : null,
                  real_twohand_oracle_metrics:
                    assignmentHeadLossOnlyFullBrev.real_twohand?.oracle
                      ? {
                          coverage: round(
                            assignmentHeadLossOnlyFullBrev.real_twohand.oracle.coverage,
                          ),
                          distinct_assigned_coverage: round(
                            assignmentHeadLossOnlyFullBrev.real_twohand.oracle
                              .distinct_assigned_coverage,
                          ),
                          collapse_rate: round(
                            assignmentHeadLossOnlyFullBrev.real_twohand.oracle.collapse_rate,
                          ),
                          n: assignmentHeadLossOnlyFullBrev.real_twohand.oracle.n ?? null,
                        }
                      : null,
                }
              : null,
            comparison: assignmentHeadRepairReceipt.comparison ?? null,
            brev_cleanup: assignmentHeadRepairReceipt.brev_cleanup ?? null,
            runtime_boundary: assignmentHeadRepairReceipt.runtime_boundary ?? null,
            selection: assignmentHeadRepairReceipt.selection ?? null,
            next_action: assignmentHeadRepairReceipt.next_action ?? null,
          }
        : null,
      focused_sliver_subproposal_repair: focusedSliverRepairReceipt.schema_version
        ? {
            receipt: rel(focusedSliverRepairReceiptFilePath),
            status: focusedSliverRepairReceipt.status ?? null,
            code: focusedSliverRepairReceipt.code ?? null,
            focused_sliver_oracle_aug64: focusedSliverOracleAug64.schema_version
              ? {
                  receipt: rel(sideReceipts.focusedSliverSubproposalOracleAug64),
                  params: focusedSliverOracleAug64.params ?? null,
                  base_oracle_metrics: focusedSliverOracleAug64.base_oracle_metrics ?? null,
                  subproposal_oracle_metrics:
                    focusedSliverOracleAug64.subproposal_oracle_metrics ?? null,
                  recovered_rows: focusedSliverOracleAug64.recovered_rows ?? [],
                  regressed_rows: focusedSliverOracleAug64.regressed_rows ?? [],
                }
              : null,
            full_scope_brev: focusedSliverDirectPairFullBrev.schema_version
              ? {
                  receipt: rel(sideReceipts.focusedSliverDirectPairFullBrev),
                  weights: rel(sideReceipts.focusedSliverDirectPairFullBrevWeights),
                  params: {
                    max_train_rows:
                      focusedSliverDirectPairFullBrev.params?.max_train_rows ?? null,
                    epochs: focusedSliverDirectPairFullBrev.params?.epochs ?? null,
                    batch_groups:
                      focusedSliverDirectPairFullBrev.params?.batch_groups ?? null,
                    subproposal_source_topk:
                      focusedSliverDirectPairFullBrev.params?.subproposal_source_topk ??
                      null,
                    subproposal_max_topk:
                      focusedSliverDirectPairFullBrev.params?.subproposal_max_topk ??
                      null,
                  },
                  pair_counts: focusedSliverDirectPairFullBrev.pair_counts ?? null,
                  validation_selection:
                    focusedSliverDirectPairFullBrev.validation_selection?.best ?? null,
                  real_twohand_selected_metrics:
                    focusedSliverDirectPairFullBrev.real_twohand?.selected
                      ? {
                          coverage: round(
                            focusedSliverDirectPairFullBrev.real_twohand.selected.coverage,
                          ),
                          distinct_assigned_coverage: round(
                            focusedSliverDirectPairFullBrev.real_twohand.selected
                              .distinct_assigned_coverage,
                          ),
                          collapse_rate: round(
                            focusedSliverDirectPairFullBrev.real_twohand.selected
                              .collapse_rate,
                          ),
                          coverage_failure_count:
                            focusedSliverDirectPairFullBrev.real_twohand.selected
                              .coverage_failure_count ?? null,
                          distinct_assignment_failure_count:
                            focusedSliverDirectPairFullBrev.real_twohand.selected
                              .distinct_assignment_failure_count ?? null,
                          n: focusedSliverDirectPairFullBrev.real_twohand.selected.n ?? null,
                        }
                      : null,
                  real_twohand_oracle_metrics:
                    focusedSliverDirectPairFullBrev.real_twohand?.oracle
                      ? {
                          coverage: round(
                            focusedSliverDirectPairFullBrev.real_twohand.oracle.coverage,
                          ),
                          distinct_assigned_coverage: round(
                            focusedSliverDirectPairFullBrev.real_twohand.oracle
                              .distinct_assigned_coverage,
                          ),
                          collapse_rate: round(
                            focusedSliverDirectPairFullBrev.real_twohand.oracle
                              .collapse_rate,
                          ),
                          n: focusedSliverDirectPairFullBrev.real_twohand.oracle.n ?? null,
                        }
                      : null,
                }
              : null,
            comparison: focusedSliverRepairReceipt.comparison ?? null,
            brev_cleanup: focusedSliverRepairReceipt.brev_cleanup ?? null,
            runtime_boundary: focusedSliverRepairReceipt.runtime_boundary ?? null,
            selection: focusedSliverRepairReceipt.selection ?? null,
            next_action: focusedSliverRepairReceipt.next_action ?? null,
          }
        : null,
      pair_ranker_calibration_audit: pairRankerCalibrationAuditReceipt.schema_version
        ? {
            receipt: rel(pairRankerCalibrationAuditReceiptFilePath),
            status: pairRankerCalibrationAuditReceipt.status ?? null,
            code: pairRankerCalibrationAuditReceipt.code ?? null,
            side_receipt: focusedSliverDirectPairCalibrationAudit.schema_version
              ? {
                  receipt: rel(sideReceipts.focusedSliverDirectPairCalibrationAudit),
                  contact_sheet: exists(sideReceipts.focusedSliverDirectPairCalibrationContactSheet)
                    ? rel(sideReceipts.focusedSliverDirectPairCalibrationContactSheet)
                    : null,
                  metrics: focusedSliverDirectPairCalibrationAudit.metrics ?? null,
                  summary: focusedSliverDirectPairCalibrationAudit.summary ?? null,
                  selection: focusedSliverDirectPairCalibrationAudit.selection ?? null,
                }
              : null,
            audit_run: pairRankerCalibrationAuditReceipt.audit_run ?? null,
            interpretation: pairRankerCalibrationAuditReceipt.interpretation ?? null,
            runtime_boundary: pairRankerCalibrationAuditReceipt.runtime_boundary ?? null,
            selection: pairRankerCalibrationAuditReceipt.selection ?? null,
            next_action: pairRankerCalibrationAuditReceipt.next_action ?? null,
          }
        : null,
      direct_pair_margin_objective_smoke: directPairMarginObjectiveReceipt.schema_version
        ? {
            receipt: rel(directPairMarginObjectiveReceiptFilePath),
            status: directPairMarginObjectiveReceipt.status ?? null,
            code: directPairMarginObjectiveReceipt.code ?? null,
            local_validation: directPairMarginObjectiveReceipt.local_validation ?? null,
            local_smoke: directPairMarginSmoke.schema_version
              ? {
                  receipt: rel(sideReceipts.directPairMarginSmoke),
                  weights: exists(sideReceipts.directPairMarginSmokeWeights)
                    ? rel(sideReceipts.directPairMarginSmokeWeights)
                    : null,
                  params: directPairMarginSmoke.params ?? null,
                  pair_counts: directPairMarginSmoke.pair_counts ?? null,
                  validation: selectedPairMetrics(directPairMarginSmoke, "validation"),
                  test: selectedPairMetrics(directPairMarginSmoke, "test"),
                  real_twohand: selectedPairMetrics(directPairMarginSmoke, "real_twohand"),
                }
              : null,
            smoke_run: directPairMarginObjectiveReceipt.smoke_run ?? null,
            brev_status_check: directPairMarginObjectiveReceipt.brev_status_check ?? null,
            brev_login_attempt: directPairMarginObjectiveReceipt.brev_login_attempt ?? null,
            blocked_audit: directPairMarginObjectiveReceipt.blocked_audit ?? null,
            prepared_full_scope_brev_run:
              directPairMarginObjectiveReceipt.prepared_full_scope_brev_run ?? null,
            runtime_boundary: directPairMarginObjectiveReceipt.runtime_boundary ?? null,
            selection: directPairMarginObjectiveReceipt.selection ?? null,
            next_action: directPairMarginObjectiveReceipt.next_action ?? null,
          }
        : null,
      focus_frame_diagnostic: focusLabels
        ? {
            labels_path: rel(focusLabelsPath),
            frame_count: Array.isArray(focusLabels.frames)
              ? focusLabels.frames.length
              : Object.keys(focusLabels.frames ?? {}).length,
            label_stats: focusLabels.stats ?? null,
            debug_summary_path: exists(focusDebugSummaryPath) ? rel(focusDebugSummaryPath) : null,
            debug_summary: summarizeFocusDebug(focusDebug),
            training_authority: "diagnostic/human-review only; not automatically clean training data",
          }
        : null,
      hand_state_bottleneck: handStateBottleneck,
    },
    gates,
    completed_this_slice: [
      "Redirected GOAL.md active prompt to M3JB.",
      "Added a rerunnable M3JB hand-state tracker audit over existing prompt, side-worktree receipts, browser fail-closed surfaces, and diagnostic focus-frame evidence.",
      "Added side-worktree pair-ranker support for explicit handness/slot, box-quality, and broad-box hard-negative targets.",
      "Ran a bounded target-weighted top-20 pair-ranker probe and recorded it as diagnostic because it did not beat the current crop/pose ranker best.",
      "Added validation-selected target-ranker checkpointing and recorded the e20 validation-selected candidate as current fail-closed pair-ranker candidate.",
      "Added oracle-only candidate-generation sweep for wider top-K/NMS settings; the current proposal head plateaus below the M3JB distinct-assignment gate.",
      "Added eval-only hard-target repair manifest and contact sheet for the three real two-hand frames still missed by the current-head top-40/NMS0.5 oracle.",
      "Added eval-only no-leak train/validation near-miss analog manifest; train+validation have zero direct top-40/NMS0.5 oracle failures, with one train near-miss and five validation monitors below min-best IoU 0.55.",
      "Ran a bounded local proposal-head continuation using the one train analog; validation selection stayed at the warm-start and real two-hand distinct assignment did not improve, so the probe is rejected.",
      "Expanded no-leak near-miss mining to min-best IoU <= 0.65, yielding seven train analogs and nine validation monitors without using validation rows for training.",
      "Ran a bounded local proposal-head continuation using the seven expanded train analogs; validation selection again stayed at the warm-start and real two-hand distinct assignment did not improve, so simple analog oversampling remains rejected.",
      "Added an eval-only deterministic subproposal oracle; it recovers two of the three remaining current-head oracle misses and raises distinct assignment to 0.988095, proving a broader trainable subproposal head is worth pursuing.",
      "Added a trainable geometry-only subproposal ranker path and ran a bounded top-40/src8/aug40 local probe; the path trains and receipts cleanly but is rejected because selected real two-hand distinct assignment is 0.630952 with 0.130952 collapse while the oracle remains 0.988095.",
      "Ran a bounded crop/pose pairwise subproposal ranker probe using owned per-hand landmark features; it is rejected because selected real two-hand distinct assignment is 0.607143 with 0.154762 collapse while the oracle remains 0.988095.",
      "Added a candidate-level crop/pose subproposal head and ran a bounded top-40/src8/aug24 local probe; it is rejected because selected real two-hand distinct assignment is 0.380952 with 0.000000 collapse while the oracle remains 0.988095.",
      "Recorded user authorization for Brev/NVIDIA compute and the policy that final model-candidate training/evaluation must not be reduced merely to fit local Mac runtime.",
      "Added an eval-only candidate-selection failure audit; it found 52/84 real two-hand rows fail under the candidate head while the oracle fails only 1/84, with dominant tags selected_low_target_candidate, quality_false_positive, selected_subbox_too_small, and same_gt_slot_selected.",
      "Added an optional pair-rank loss to the candidate-level selector, smoke-tested it locally, recovered the retained L40S worker after initial provider safety failures, and completed the uncapped full-scope Brev run with --max-train-rows 0.",
      "Ran a failure audit for the uncapped pair-rank Brev selector; it found 47/84 real two-hand rows still fail while the oracle fails only 1/84, with dominant tags selected_low_target_candidate, quality_false_positive, same_gt_slot_selected, selected_subbox_too_small, and selected_hard_negative_candidate.",
      "Stopped both observed Brev workers after copyback and verification.",
      "Added an optional pair-margin loss to the candidate-level selector, smoke-tested it locally, and ran an uncapped full-scope Brev fitting with --max-train-rows 0.",
      "Rejected the pair-margin candidate-head repair: real two-hand coverage/collapse improved slightly to 0.904762 / 0.047619, but distinct assignment remained 0.464286 while the oracle remained 0.988095.",
      "Ran a failure audit for the rejected pair-margin Brev selector; the dominant low-target and quality-false-positive failure modes persisted.",
      "Smoke-tested the direct pair-scorer path locally, recovered healthy Brev capacity, and ran the uncapped full-scope direct pair scorer with --max-train-rows 0.",
      "Rejected the uncapped direct pair scorer as fail-closed: real two-hand distinct assignment improved to 0.690476 but remains below the 0.98 box gate while the oracle remains 0.988095.",
      "Audited the direct-pair distinct-assignment failures; 23/26 sampled failures have high-overlap GT hand pairs, while only 1 has high selected-pair overlap.",
      "Added an overlap-aware direct-pair assignment head with none/direct/swapped targets, positive weighting, high-overlap-GT weighting, and optional assignment evidence in pair scoring.",
      "Smoke-tested the assignment-head path locally, synced it to the retained L40S worker, and ran two uncapped full-scope Brev variants with --max-train-rows 0.",
      "Rejected both assignment-head variants as fail-closed: score+loss reached 0.642857 real two-hand distinct assignment and loss-only reached 0.678571, both below the prior direct-pair 0.690476 and far below the 0.98 gate.",
      "Stopped the retained Brev worker after assignment-head artifact copyback and verification.",
      "Added focused tiny/edge sliver subproposal generation and origin diagnostics; aug64 is the smallest checked focused-sliver budget that reaches perfect real two-hand oracle coverage/distinct/collapse of 1.000000 / 1.000000 / 0.000000.",
      "Ran an uncapped full-scope Brev direct pair-scorer over focused-sliver aug64 candidates with --max-train-rows 0 and 5,110,560 train pairs.",
      "Rejected the focused-sliver aug64 direct pair-scorer as fail-closed: real two-hand selected coverage/distinct/collapse was 0.880952 / 0.523810 / 0.059524 while the same candidate set oracle was 1.000000 / 1.000000 / 0.000000.",
      "Added and ran an eval-only pair-ranker calibration audit; all 45 focused-sliver aug64 audit failures have an oracle-compatible pair available but under-ranked, with mean oracle logit rank 113.355556 and median rank 26 on failures.",
      "Added an optional hard-negative margin loss to the direct pair-ranker, proved it with py_compile/self-test, and ran a train32/src4/aug16 local smoke. The smoke is diagnostic only; the uncapped Brev run is pending a Brev auth refresh.",
      "Recorded the local top-2 objectness + NMS heuristic baseline on the 84 real two-hand rows: coverage 0.964286, distinct assignment 0.428571, decoded two distinct 1.000000, collapse 0.000000.",
      "Recorded the product gate-reframe question: current evidence proves two non-collapsed boxes under the heuristic baseline but does not prove that distinct L/R assignment >= 0.98 is required by the recognizer.",
      "Recorded the deterministic post-filter named-failure-mode ceiling from the existing candidate-selection failure audit: coverage rises to 0.988095, distinct assignment rises to 0.976190, and the current named filters still miss the 0.98 distinct gate by two rows.",
      "Answered the product gate question for the current browser code path: active pass/fail recognition is raw-frame/model-card based and fail-closed, and live tracking is preview-only with anonymous hand_0/hand_1 display tracks, so distinct anatomical L/R assignment is not a current recognizer requirement.",
      "Split the current product two-box proxy from the future stable slot/L/R identity contract so the remaining 0.98 distinct-assignment metric stays fail-closed without blocking the current raw-frame recognizer.",
      "Recorded the current landmark heatmap-head candidate and source-preserved crop-quality bottleneck: heatmap PCK@0.10 / PCK@0.05 is 0.801000 / 0.465600 and still below gate, while clean crops are much stronger than edge/OOB/high-error crops.",
      "Recorded the fixed source-preserved crop/relabel candidate backlog: 512 test candidates and 1024 train candidates, dominated by rebuild_crop_with_more_context_or_mask_oob_keypoints.",
      "Recorded an OOB/visible-keypoint policy probe: visible-keypoint masking improves edge/OOB aggregate PCK, but zero fixed backlog candidates reach visible PCK@0.10 >= 0.90, so crop-context rebuild remains required.",
      "Recorded a crop-context geometry probe: default source-crop expansion resolves only 2/369 test and 22/823 train teacher-edge rows, so the backlog needs targeted offline relabel or clearer-source review rather than crop expansion alone.",
      "Recorded the targeted relabel queue: 367 test and 801 train true frame-edge/OOB candidates have source videos available, and the top 32 train/test manifest prefixes are all frame-edge rows for a bounded local relabel smoke.",
      "Ran and recorded the bounded targeted relabel smoke: train top32 processed 32/32 and wrote 1 strict accepted row; diagnostic test top32 processed 32/32 and wrote 0 strict accepted rows, so strict offline relabel is low-yield and not cache-rebuild-ready.",
      "Ran and recorded the selected-only acceptance diagnostic: train selected-only wrote 22/32 but only 1 row passed visible>=0.50 with <=4 OOB points; diagnostic test selected-only wrote 30/32 but 0 rows passed that moderate threshold.",
      "Recorded the frame-edge cache policy decision: 0/52 selected-only true-frame-edge/OOB rows pass the moderate cache-rebuild policy once requested-hand match and center-distance are required.",
      "Materialized the full frame-edge disposition manifest for 801 train and 367 test true-frame-edge/OOB rows; 52 selected-only probe rows are excluded and 1116 unprobed rows require clearer-source review before cache rebuild.",
      "Committed the selected-only frame-edge/OOB exclusion seed: 52 rows are blocked from landmark cache rebuild, with 1116 unprobed frame-edge rows still held for clearer-source review.",
      "Selected a bounded clearer-source review subset from the 1116 unprobed frame-edge/OOB rows: 32 train and 32 diagnostic test rows, with 0 rows authorized for cache rebuild.",
      "Initialized the clearer-source review outcome ledger for the 64-row subset: all rows are pending manual source review, with 0 cache-safe replacements, 0 explicit exclusions, and 0 cache rebuild authorizations.",
      "Added a preservation and validation contract for the clearer-source review outcome ledger: future reviewer decisions are preserved by review_key, cache-safe replacements require source/provenance/reviewer fields, and invalid rows fail the audit instead of being silently cache-authorized.",
      "Recorded a metadata-only clearer-source review packet for the first 16 pending ledger rows: 8 train and 8 diagnostic test rows, all locally source-available, with 0 embedded raw frames and 0 cache rebuild authorizations.",
      "Batch-finished the clearer-source outcome ledger under the anti-grind redirect: all 64 selected rows now have explicit frame-edge/OOB exclusions, with 0 pending reviews, 0 cache-safe replacements, and 0 cache rebuild authorizations.",
      "Recorded the heatmap/soft-argmax landmark-head decision as valid for the next scratch student lane after crop-cache rebuild, but still below the landmark gate and not a solved post-hoc filter.",
      "Rebuilt the per-hand crop cache with the 64 ledger exclusions applied and recorded eval-only PCK on the existing scratch checkpoint: 30120 crops, test PCK@0.10 0.6633 (+0.0046), and test PCK@0.05 0.3722 (+0.0026).",
      "Recorded an approval-gated Brev plan for full scratch per-hand landmark retraining on the rebuilt cache: no warm start, no train-row cap, CUDA full-cache command, PCK@0.10/PCK@0.05 remeasurement, max runtime/spend, copyback, and duplicate-worker guardrails.",
      "Recorded a local-only preflight for the approval-gated landmark retrain plan: trainer syntax and required CLI flags pass, the rebuilt cache still has 30120 aligned frame/keypoint rows, planned outputs are absent, and Brev/training remains not_run.",
      "Refreshed read-only Brev workspace visibility for the approval-gated landmark retrain plan: the retained asl-pilot-m3eh-l40s-001 worker is RUNNING/READY/HEALTHY, but launch remains not_run pending explicit current-thread Brev/GPU spend approval.",
      "Recorded the exact human approval request and authorization envelope for the approval-gated Brev landmark retrain plan; this does not itself approve spend or launch any remote work.",
      "Recorded the repeated current-thread Brev/GPU spend approval blocker after the approval request envelope was made exact; actual launch remains not_run and no remote, training, eval, checkpoint, browser, raw-upload, or pretrained-runtime change occurred.",
      "Recorded current-thread human approval for the bounded M3JB landmark retrain plan in GOAL.md, the active prompt, the plan receipt, and the approval receipt; this approval-alignment slice still leaves launch not_run.",
      "Aligned GOAL.md and the active M3JB prompt with the approval-gated retrain plan so stale top-2/NMS or broad retrain directives cannot authorize Brev launch without explicit current-thread spend approval.",
      "Validated the preferred Codex supervisor launch path with a dry-run under the asl-pilot-local-skills profile and recorded that no autonomous loop, Brev command, executor turn, observer turn, or training run was launched.",
      "Recorded a dry-run-only receipt for the legacy/debug --role both Codex launch path; both generated executor/observer loops use asl-pilot-local-skills, but actual launch remains not_run while Brev approval is pending.",
      "Consumed the current-thread Brev approval for M3JB landmark retrain plan v1, ran the recorded scratch CUDA retrain/eval-only PCK@0.10/PCK@0.05 commands on asl-pilot-m3eh-l40s-001, copied back the planned artifacts, and stopped the worker.",
      "Rejected the approved scratch retrain fail-closed: eval-only PCK@0.10 / PCK@0.05 regressed to 0.648400 / 0.365100 versus the rebuilt-cache baseline 0.663300 / 0.372200 and remain below the 0.90 / 0.75 landmark gates.",
      "Recorded the local no-Brev regression pivot: cache exclusions helped the existing checkpoint only slightly, the same w64/heatmap32 quality-filtered scratch retrain regressed broadly, same-envelope relaunch and more row deletion are rejected, and resolution/capacity preflight is selected next.",
      "Recorded the required research-guided PCK campaign plan via GPT-Pro browser attempt plus gpt-5.5 API fallback; selected the first supported experiment as w96/heatmap48 full-train scratch PerHandHeatmapNet with no destructive train-quality filter.",
      "Ran the first research-guided Brev campaign experiment after patching the trainer's non-power-of-two heatmap-grid support: w96/heatmap48 full-train improved held-out PCK@0.10/PCK@0.05 to 0.7392/0.4533, copied planned artifacts back, and stopped the worker.",
      "Ran the second research-guided Brev campaign experiment: w128/heatmap64 full-train improved held-out PCK@0.10/PCK@0.05 to 0.7496/0.4867, copied planned artifacts back, and stopped the worker.",
      "Ran the third research-guided Brev campaign experiment: w128/heatmap64 with hard-geometry oversampling and mild augmentation regressed held-out PCK@0.10/PCK@0.05 to 0.7340/0.4506 versus run2, copied planned artifacts back, and stopped the worker.",
      "Recorded the post-run3 no-Brev research refresh via GPT-Pro browser attempt plus gpt-5.5 API fallback; selected a scratch residual U-Net / lightweight hourglass heatmap architecture preflight before any further paid run.",
      "Completed the local scratch ResUNet/hourglass preflight without Brev, training, optimizer/backward, or checkpoint writes; the side trainer commit 712ab989d9451e92894ee72fc73e757a21f6d1ea passes CPU forward/loss/decode/eval smoke and records the exact run4 Brev envelope.",
      "Completed the recognizer scheduler preflight without Brev or checkpoint output: side trainer commit 8a780aef462e616d365319a1ef577f9d93395979 adds fixed-default scheduler flags, local tiny no-save overfit reaches train top-1 1.000, and full-data no-save smoke records 7011/955/2369 train/monitor/test counts plus the run3 expected 13200 optimizer-step envelope.",
      "Ran the run3 scheduler fulltrain recognizer experiment on Brev: full data, cosine scheduler, 13200 optimizer steps, test top-1 0.2984, top-5 0.6036, verification recall@FAR10 0.7316, copied artifacts back, stopped the worker, and rejected promotion fail-closed below the 0.85 recall gate.",
      "Recorded the run3 no-Brev recognizer research tuning pass via GPT-Pro browser attempt plus gpt-5.5 API fallback; selected T=32 recognizer cache/loader preflight as the next local-only slice before any paid run4.",
      "Completed the local T=32 loader support preflight without Brev, training, optimizer/backward, or checkpoint writes: side trainer commit 46cd3ddf69fd8bf2e1cf17523f4217f335c8cd6d adds --seq-len and --dry-run-forward, the current T=20 cache fails a T=32 guard as expected, and a one-batch dry-run records logits [4,95] with zero optimizer steps.",
      "Materialized and validated a local all-label T=32 recognizer smoke cache without Brev or training: clips-per-word 1 produced 9120 rows / 285 clips / 95 labels at 32 frames per clip, and the Transformer dry-run recorded logits [8,95] with zero optimizer steps and no checkpoint.",
      "Materialized and validated the full local T=32 recognizer cache without Brev or training: PopSign plus ASL Citizen produced 330309 rows / 10335 clips / 95 labels, and the Transformer dry-run recorded logits [128,95] with zero optimizer steps, no checkpoint, and planned run4 optimizer steps 13200.",
      "Attempted the approved run4 T=32 Brev slice but stopped at worker preflight: retained L40S SSH never became available, no remote sync/training/checkpoint occurred, stop by name/id/all completed, and final Brev state was STOPPED / NOT READY / UNHEALTHY.",
      "Refreshed run4 T=32 Brev health read-only with no lifecycle, exec, sync, training, checkpoint, final-gate change, or push: initial inventory showed both existing L40S workspaces STOPPED / NOT READY / UNHEALTHY, then final validation showed the retained worker recovered to RUNNING / READY / HEALTHY and was not stopped while approved run4 work remains queued.",
      "Ran the approved run4 T=32 recognizer fulltrain on Brev: synced and hash-verified the full T=32 cache and current trainer, completed 13200 optimizer steps, improved verification recall@FAR10 to 0.7626 with test top-1/top-5 0.3132/0.6214, copied artifacts back, stopped the worker, and rejected promotion fail-closed below the 0.85 gate.",
      "Recorded the run4 no-Brev recognizer research tuning pass via GPT-Pro/browser route check plus gpt-5.5 API fallback; selected a training-only supervised-contrastive auxiliary-loss preflight with --supcon-weight/--supcon-temperature before any paid run5.",
      "Completed the local run5 supervised-contrastive auxiliary-loss preflight without Brev, training, optimizer/backward, or checkpoint output: side recognizer commit 896d5fb adds disabled-by-default --supcon-weight/--supcon-temperature support, the zero-weight dry-run preserves the CE/KD base loss at 7.84514, and the weighted dry-run records finite SupCon loss 4.918027 with 89 positive anchors and planned paid steps 13200.",
      "Ran the approved run5 SupCon recognizer fulltrain on Brev: synced and hash-verified side commit 896d5fb, completed 13200 optimizer steps with nonzero SupCon diagnostics, copied artifacts back, stopped the worker, and rejected promotion fail-closed at verification recall@FAR10 0.7601 despite improved test top-1/top-5 0.3369/0.6235.",
      "Recorded the run5 no-Brev recognizer research tuning pass via GPT-Pro/browser route check plus gpt-5.5 API fallback; selected verification-margin diagnostics plus monitor verification-recall checkpoint-selection preflight before any paid run6.",
      "Completed the local run6 verification-margin and checkpoint-selection preflight without Brev, training, optimizer/backward, or checkpoint output: side recognizer commit 0f54967 adds detailed per-class FAR10 thresholds/quantiles and trainer --checkpoint-metric monitor_verification_recall_far10 support, the diagnostic reproduces run4/run5 test recall within abs <= 0.002, and the dry-run computes monitor_verification_recall_far10 on the full T=32 cache with planned paid steps 13200.",
      "Attempted the approved run6 T=32 verification-selection Brev slice but stopped at worker preflight: retained L40S SSH/CUDA/process preflight never passed before sync/training/checkpoint/copyback, the initial stop path showed STOPPED / NOT READY / UNHEALTHY, final validation found late recovery to RUNNING / READY / HEALTHY, and the worker was stopped for cost control with final state STOPPED / NOT READY / HEALTHY.",
      "Ran the approved run6 T=32 verification-selection fulltrain on Brev: synced and hash-verified side commit 0f54967, completed 13200 optimizer steps with best checkpoint selection by monitor_verification_recall_far10, copied JSON/PT/log/dry-run artifacts back, stopped the worker, and rejected promotion fail-closed at verification recall@FAR10 0.8039 despite improving over run4's 0.7626.",
      "Recorded the run6 no-Brev recognizer research tuning pass via GPT-Pro/browser route check plus gpt-5.5 API fallback; selected a no-training run6 verification-tail audit joined with class counts, teacher coverage, score quantiles, and hard-negative pairs before any paid class-balanced CE run7.",
      "Completed the local run7 verification-tail audit without Brev, training, optimizer/backward, checkpoint, or export: side recognizer commit 885477c adds split class-count and teacher-coverage joins plus hard-negative pair reporting; the diagnostic reproduces run6 held-out recall at 0.8038559556786704, finds only 5 of the top 10 gap classes count/coverage constrained, rejects class-balanced CE as not proven, and selects a no-Brev hard-negative objective research pass.",
      "Recorded the run7 no-Brev hard-negative objective research pass via GPT-Pro/browser route check plus gpt-5.5 API fallback; selected a local default-off batch-local OVR-BCE hard-negative objective preflight before any paid run7, and rejected fixed held-out test-mined pairs as training supervision.",
      "Completed the local run7 OVR-BCE hard-negative preflight without Brev, training, optimizer/backward, checkpoint, or export: side recognizer commit 828f5cf5 adds default-off batch-local OVR-BCE support, zero-weight parity holds, active weight 0.03 records finite loss with no true-label negatives, and the gated paid run7 recipe is selected.",
      "Ran the approved run7 OVR-BCE hard-negative fulltrain on Brev: synced and hash-verified side commit 828f5cf5, completed the full T=32 240-epoch / 13200-step recipe with monitor-verification checkpoint selection, copied JSON/PT/log/dry-run artifacts back, stopped the worker, and rejected promotion fail-closed at verification recall@FAR10 0.7759 because it regressed versus run6's 0.8039.",
      "Recorded the run7 OVR-BCE no-Brev research/postmortem pass via GPT-Pro/browser route check plus gpt-5.5 API fallback; the memo diagnoses likely split-specific calibration/positive-margin damage and selects a paired run6-vs-run7 verification calibration audit before any paid run8.",
      "Completed the local run6-vs-run7 paired calibration audit without Brev, training, optimizer/backward, checkpoint, or export: side recognizer commit bfd1e783 adds per-class margin/rank/hard-negative-pair deltas, the audit confirms positive-margin calibration damage, but fails the explicit run7 local test-recall reproduction tolerance and therefore does not authorize paid run8.",
      "Resolved the run7 local-vs-CUDA test-recall discrepancy without Brev, training, optimizer/backward, checkpoint, or export: the original CUDA receipt records exact recall 0.7759113573407201, local CPU replay differs only by one positive in each of classes 'not' and 'see', and the mismatch is recorded as threshold-boundary numerical sensitivity rather than split/checkpoint/evaluator error.",
      "Completed the run8 OVR-BCE weight 0.01 preflight without Brev, training, optimizer/backward, checkpoint, or export: the accepted local MPS dry-run preserves base loss 7.84514, records OVR-BCE loss 1.569024 with weighted contribution 0.01569, selects 1024 batch-local hard negatives with zero true-label matches, and selects the bounded fulltrain run8 envelope.",
      "Attempted the bounded run8 OVR-BCE weight 0.01 Brev fulltrain slice but stopped at worker preflight: retained L40S SSH never became reachable, CUDA/process preflight, sync, dry-run, training, checkpoint, and copyback did not occur, stop by name/id/all completed, initial final Brev state was STOPPED / NOT READY / UNHEALTHY, then a late read-only inventory found the retained worker recovered to RUNNING / READY / HEALTHY and it was not stopped while approved run8 work remains queued.",
      "Ran the bounded run8 OVR-BCE weight 0.01 fulltrain on Brev: verified the recovered retained L40S over SSH/CUDA, completed the full T=32 240-epoch / 13200-step recipe with monitor-verification checkpoint selection, copied JSON/PT/log/dry-run artifacts back by hash, sent OS shutdown after Brev API auth became unavailable, and rejected promotion fail-closed at verification recall@FAR10 0.7571 because it regressed versus run6's 0.8039.",
      "Recorded the run8 OVR-BCE weight 0.01 no-Brev research/postmortem pass via GPT-Pro/browser route check plus gpt-5.5 API fallback; the memo recommends stopping OVR-BCE for now, selecting a local run6/run7/run8 calibration-tail and checkpoint-selection audit, and choosing no paid recipe until that diagnostic explains the regression mode.",
      "Completed the local run6/run7/run8 calibration-tail audit without Brev, training, optimizer/backward, checkpoint, or export: side recognizer commit ad16b00d adds the three-run diagnostic, the detailed audit reproduces run6/run7/run8 held-out recall within tolerance, shows run7 is best by monitor while run6 is best by held-out test, classifies run8-vs-run6 as broad positive-margin damage and run8-vs-run7 as localized positive-margin damage, and selects no paid recipe.",
      "Recorded the post-OVR-BCE calibration-safe research pass via GPT-Pro/browser route check plus gpt-5.5 API fallback; the memo keeps no paid recipe selected and chooses a local run6 monitor/checkpoint-selection stability preflight using existing run6 artifacts before any future fulltrain.",
      "Completed the run6 monitor-selection stability preflight without Brev, training, optimizer/backward, checkpoint, or export: side recognizer commit 4b9c9325602f adds the artifact-only diagnostic, reconstructs run6 epoch 14 as the current best monitor-verification checkpoint, identifies epoch 31 as the trailing mean/median robust-selector candidate, and fails closed because no epoch-31 checkpoint or per-epoch logits were retained for held-out test transfer.",
      "Completed the candidate checkpoint retention preflight without Brev, training, optimizer/backward, checkpoint, or export: side recognizer commit 8e90c24d adds default-off candidate retention flags, the full T=32 dry-run records planned future steps 13200, zero actual optimizer steps, checkpoint_write_blocker dry_run_forward, retained_checkpoint_count 0, and no paid recipe selected.",
      "Recorded the retention-enabled research tuning pass via GPT-Pro/browser route check plus gpt-5.5 API fallback; the memo recommends a no-Brev run9 retention-enabled run6 recipe/preflight receipt and keeps any future paid run gated behind that preflight plus Brev auth recovery.",
      "Completed the run9 retention-enabled run6 recipe preflight without Brev, training, optimizer/backward, checkpoint, or export: the full T=32 no-save dry-run records train/monitor/test 7011/955/2369, planned future steps 13200, OVR-BCE and SupCon disabled, monitor_verification_recall_far10 checkpoint selection, candidate checkpoint retention epsilon 0.005/window 5, no .pt output, and a future fulltrain envelope that remains blocked until Brev auth visibility succeeds.",
      "Completed the run9 Brev auth visibility refresh without spend, lifecycle, exec, sync, training, checkpoint, export, gate change, or push: brev ls --json exited 1 with a logged-out prompt and EOF, no JSON inventory was available, retained worker state remains unknown/auth-blocked, and future run9 fulltrain remains blocked until human Brev CLI login is restored.",
      "Retried the run9 Brev auth visibility refresh without spend, lifecycle, exec, sync, training, checkpoint, export, gate change, or push: brev ls --json still exited 1 with a logged-out prompt and EOF, no JSON inventory was available, retained worker state remains unknown/auth-blocked, and future run9 fulltrain remains blocked until human Brev CLI login is restored.",
      "Recorded the run9 Brev auth human-login boundary without spend, lifecycle, exec, sync, training, checkpoint, export, gate change, or push: four no-spend visibility probes across sessions 955-958 still exit 1 with logged-out/EOF, so further automated Brev CLI retries are parked until the human explicitly confirms Brev CLI login/auth is restored.",
      "Recorded the current M3JB baseline as fail-closed and not gate-passing.",
    ],
    remaining_gates: [
      "Two-hand box behavior is demo-complete under the current product proxy: two non-collapsed boxes are recorded, and anatomical L/R identity is descoped unless a future consumer requires it.",
      "Landmarks need PCK@0.10 >= 0.90 and PCK@0.05 >= 0.75; the second research-guided campaign run remains the running-best at 0.7496 / 0.4867, while run3 regressed to 0.7340 / 0.4506 and browser mapping is still unproven.",
      "Recognizer run6 remains the held-out test running best on primary verification recall@FAR10 at 0.8039 with test top-1/top-5 0.2870/0.6399; run8 OVR-BCE weight 0.01 completed but regressed to verification recall@FAR10 0.7571 with test top-1/top-5 0.3081/0.6079. The three-run calibration-tail audit shows run7 is best by monitor while run6 is best by held-out test, classifies run8 regression as positive-margin damage rather than a safe OVR-BCE path, the run6 monitor-selection stability preflight showed epoch 31 cannot be scored from old artifacts, the run9 retention-enabled run6 recipe preflight records the future fulltrain envelope, and the no-spend Brev visibility path is parked until human Brev CLI login confirmation because repeated probes remain logged-out/EOF.",
      "Crop/relabel policy now has a full frame-edge disposition manifest, a 52-row selected-only exclusion seed, a 64-row clearer-source review subset, and a batch-finished fail-closed outcome ledger with 64 explicit exclusions and 0 pending reviews. The cache was rebuilt, the full scratch retrain regressed below baseline, run1/run2 improved PCK, the hard-geometry augmentation run3 failed to beat the running best, the post-run3 research refresh selected a local scratch residual heatmap architecture preflight, and that preflight is now complete with the run4 ResUNet envelope recorded.",
      "Tracking needs swap/stale/collapse receipts; no temporal HandTrack receipt exists yet.",
      "Browser parity and live /tracking truth remain default-off until the hand-state gates pass.",
    ],
    next_action:
      recognizerRun9RetentionEnabledWaitForHumanBrevLoginNextAction,
    next_action_reason:
      "Brev CLI auth remains logged out after repeated no-spend probes; wait for explicit human confirmation that Brev CLI login/auth is restored before running another no-spend visibility refresh.",
  };

  if (args.writeReceipt) {
    if (landmarkFrameEdgeDispositionManifest) {
      const manifestOutput = path.join(root, frameEdgeDispositionManifestPath);
      fs.mkdirSync(path.dirname(manifestOutput), { recursive: true });
      fs.writeFileSync(
        manifestOutput,
        `${JSON.stringify(landmarkFrameEdgeDispositionManifest, null, 2)}\n`,
      );
      result.wrote_frame_edge_disposition_manifest =
        frameEdgeDispositionManifestPath;
    }
    if (landmarkFrameEdgeExclusionSeed) {
      const exclusionSeedOutput = path.join(root, frameEdgeExclusionSeedPath);
      fs.mkdirSync(path.dirname(exclusionSeedOutput), { recursive: true });
      fs.writeFileSync(
        exclusionSeedOutput,
        `${JSON.stringify(landmarkFrameEdgeExclusionSeed, null, 2)}\n`,
      );
      result.wrote_frame_edge_exclusion_seed = frameEdgeExclusionSeedPath;
    }
    if (landmarkClearerSourceReviewSubset) {
      const clearerSourceSubsetOutput = path.join(root, clearerSourceReviewSubsetPath);
      fs.mkdirSync(path.dirname(clearerSourceSubsetOutput), { recursive: true });
      fs.writeFileSync(
        clearerSourceSubsetOutput,
        `${JSON.stringify(landmarkClearerSourceReviewSubset, null, 2)}\n`,
      );
      result.wrote_clearer_source_review_subset = clearerSourceReviewSubsetPath;
    }
    if (landmarkClearerSourceReviewOutcomes) {
      const clearerSourceOutcomesOutput = path.join(root, clearerSourceReviewOutcomesPath);
      fs.mkdirSync(path.dirname(clearerSourceOutcomesOutput), { recursive: true });
      fs.writeFileSync(
        clearerSourceOutcomesOutput,
        `${JSON.stringify(landmarkClearerSourceReviewOutcomes, null, 2)}\n`,
      );
      result.wrote_clearer_source_review_outcomes = clearerSourceReviewOutcomesPath;
    }
    if (landmarkClearerSourceReviewPacket) {
      const clearerSourcePacketOutput = path.join(root, clearerSourceReviewPacketPath);
      fs.mkdirSync(path.dirname(clearerSourcePacketOutput), { recursive: true });
      fs.writeFileSync(
        clearerSourcePacketOutput,
        `${JSON.stringify(landmarkClearerSourceReviewPacket, null, 2)}\n`,
      );
      result.wrote_clearer_source_review_packet = clearerSourceReviewPacketPath;
    }
    [
      frameEdgeDispositionManifestFilePath,
      frameEdgeExclusionSeedFilePath,
      clearerSourceReviewSubsetFilePath,
      clearerSourceReviewOutcomesFilePath,
      clearerSourceReviewPacketFilePath,
    ].forEach((filePath) => refreshArtifactRecord(result.artifacts, filePath));
    const output = path.join(root, receiptPath);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
    result.wrote_receipt = receiptPath;
  }

  if (args.json || args.writeReceipt) {
    console.log(JSON.stringify(result, null, 2));
  } else if (blockers.length === 0) {
    console.log("M3JB hand-state tracker audit passed; gates remain fail-open and runtime stays fail-closed.");
  } else {
    console.error("M3JB hand-state tracker audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
  }

  process.exit(blockers.length === 0 ? 0 : 1);
}

main();
