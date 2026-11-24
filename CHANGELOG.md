# Change log

## Unreleased

[_All changes_](https://codeberg.org/BunnyNabbit/classicborne/compare/0.1.1...main).

- Package
  - _sqlite3_ is now an optional dependency.
  - _better-sqlite3_ is added as an optional dependency. The newly introduced KeyframeRecord adapters will use these dependencies if available.
- `index.mjs`
  - [Warns when imported](https://codeberg.org/BunnyNabbit/classicborne/commit/f0e50e1f48b53a7bd0c2778fab81e753b65a01f2). Using the barrel file has always been ill advised.
- BaseHeartbeat
  - [Changed](https://codeberg.org/BunnyNabbit/classicborne/commit/e581a173d269c7048fe943185ed43c8d2a24c09b#diff-9fae3f5c2f27a5637b785e63400eaf3e28952dbe) the default server name from "A classicborne server." to "A classicborne universe.".
- KeyframeRecord
  - Refactored from the `/class/level/changeRecord/ChangeRecord.mjs` file. The class is exported from `/class/level/changeRecord/KeyframeRecord.mjs`.
  - Uses adapters to select a suitable _SQLite_ dependency.
- DroneTransmitter
  - Added [DroneTransmitter#validateClientExtensions](https://classicborne.bunnynabbit.com/classes/DroneTransmitter.html#validateclientextensions).
- [BasePlayer](https://classicborne.bunnynabbit.com/classes/BasePlayer.html)
  - Added [BasePlayer#getDisplayName](https://classicborne.bunnynabbit.com/classes/BasePlayer.html#getdisplayname).
    - Changed [BaseUniverse#addPlayer](https://classicborne.bunnynabbit.com/classes/BaseUniverse.html#addplayer) and [BaseLevel#addPlayer](https://classicborne.bunnynabbit.com/classes/BaseUniverse.html#addplayer) to use this method.
      - Drones are created with the player's display name.
      - Player list entries are created with the player's display name.
- Significant documentation and typing changes. May potentially be breaking if types are checked.
  - When referring to static members of a class, the term "class-side" is now used instead of "static.".
  - Vector3 and Vector2 are expressed as numeric tuples of fixed length. For example, Vector3 is typed as `[number, number number]` rather than an array of numbers `number[]`.

### Breaking

- ChangeRecord
  - Moved ChangeRecord#vhsFh to [ChangeRecord#vhsFileHandle](https://classicborne.bunnynabbit.com/classes/ChangeRecord.html#vhsfilehandle)

## 0.1.0

[_All changes_](https://codeberg.org/BunnyNabbit/classicborne/compare/0.0.0...0.1.0)

- Package
  - Updated _classicborne-server-protocol_ to [v0.6.0](https://codeberg.org/BunnyNabbit/classicborne-server-protocol/releases/tag/v0.6.0).
    - Extension calls such as `client.addPlayerName` are deprecated. BaseLevel, BasePlayer and DroneTransmitter have been changed to use the newer `client.extensions.get(...)` pattern.
- BaseLevel
  - Dynamically imports ChangeRecord and NullChangeRecord.
- Significant documentation and typing changes. May potentially be breaking if types are checked.

## 0.0.0

Initial release.
