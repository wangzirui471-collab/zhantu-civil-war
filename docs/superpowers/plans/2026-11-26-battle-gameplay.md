# 地图战斗玩法闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让玩家在主地图内看到并操纵持续、多方向、有炮火阶段的战斗。

**Architecture:** `engine.js` 仍是战局数据和战斗结果的唯一来源，新增战术姿态与整补中状态。`app.js` 把当前战斗呈现在主地图 HUD，`map.js` 基于真实战斗和部队位置绘制攻击路线及短时炮击动画，样式归 `index.html`/`command-room.css`。

**Tech Stack:** 原生 JavaScript、Canvas 2D、HTML/CSS、现有存档与时间线 API。

**Spec:** `docs/superpowers/specs/2026-11-26-battle-gameplay-design.md`

## Global Constraints

- 不添加运行时依赖。
- 保持中文界面和现有逐日模拟方式。
- 地图图形必须来自 `state.battles`、`state.units` 和真实城镇坐标。
- 本次不扩展到班组即时战术。
- 按当前开发指令，本轮不新增或运行自动化测试。

## Review Focus

- 同一战场存在多个攻击起点时，箭头不能漏方向或连到错误城市。
- 受挫整补中的单位不应继续承受进攻损耗，也不能丢失原目标。
- 玩家切边、战斗结束、战局加载时，HUD 与战术姿态须跟随当前状态。
- 没有炮兵/未解锁指挥点时，炮火入口应按现有校验失败并给出说明。
- 地图放大、缩小、全国/战区切换时，动画坐标须仍从城市坐标投影。

---

### Task 1: 战斗状态与可操作战术

**Files:**
- Modify: `engine.js`
- Inspect: `save-store.js`, `timeline.js` (现有快照、动作与存档路径)

**Interfaces:**
- Produces: `setBattlePosture(data, state, cityId, posture)`，只允许当前玩家设置本方参战侧姿态。
- 战场记录新增 `phase`、`engagedUnitIds`、`reserveUnitIds`、`postureBySide`；部队受挫后新增 `battleRecoveryDays`。

- [x] 战场日结时填入真实前线/预备队名册与阶段。
- [x] 将突击、包围、谨慎、坚守姿态接入宽度、战力或损耗公式。
- [x] 受挫攻击保留原目标，等待两个模拟日整补后重试；整补期间恢复组织度。
- [x] 导出姿态命令 API，并将姿态纳入既有 snapshot/undo/save 流程。
- [x] 自查历史剧本、forecast 快照、被俘/撤令分支和 AI 命令兼容性。

### Task 2: 地图战斗 HUD 与战斗动画

**Files:**
- Modify: `index.html`, `app.js`, `map.js`, `command-room.css`

**Interfaces:**
- HUD 读取 `state.battles`，按钮调用既有 `commandAbility('barrage')` 和新增姿态 API。
- Canvas 仅对 `battle.days` 增长触发有时限的动画，按各攻击部队城市与目标城镇投影。

- [x] 在地图内增加紧凑战场 HUD，展示阶段、方向数、优势比、损耗、交战/预备队数量。
- [x] 提供聚焦目标、炮火准备、攻势/坚守姿态入口，显示资源不足/冷却状态。
- [x] 为每个实际攻击方向绘制箭头，优先绘制炮兵方向的抛物线弹道和落点闪光。
- [x] 用 `requestAnimationFrame` 播放短动画；无活动动画时停止帧循环。
- [x] 在不同地图缩放、切边和战斗结束时自查坐标、状态与交互。

## Self-Review

- 规格覆盖：Task 1 覆盖持续攻击、战斗宽度、预备队与战术效果；Task 2 覆盖 HUD、炮火、多路箭头与短动画。
- 接口一致性：Task 1 产生 `setBattlePosture(data,state,cityId,posture)` 和战场记录字段；Task 2 读取相同字段并通过现有应用 action/timeline 路径调用。
- 验收限制：本轮根据开发指令不增加或运行自动化测试，完成后提供源码自查结果及这一限制。
- 比例：两项任务分别对应引擎规则与地图呈现，未拆散强耦合子系统。
- 自查结果：多选部队共用一条目标命令并各自验证路线；炮火要求敌方目标、邻近炮兵及指挥点；战斗结束的突破解算携带攻击起点供地图播放。
