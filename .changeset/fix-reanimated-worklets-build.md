---
"@loyalty-hive/app": patch
---

Fix Android EAS build failures caused by an incompatible react-native-worklets version pulled in transitively by react-native-actions-sheet. Pin Worklets 0.11.4, add a native dependency check and expo-doctor to PR CI, and use Bun's hoisted linker so dependency validation passes in the monorepo.
