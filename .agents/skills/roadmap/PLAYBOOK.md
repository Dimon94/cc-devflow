# Roadmap Playbook

## Core Rules

1. 先问现实，不先写愿景。
2. 一次只推进一个关键未知点。
3. 只定 1-3 个阶段，不写愿望清单。
4. 通过 `roadmap` 只能产出方向，不能偷拆实现任务。

## Local Kit

- 生成骨架时用 `assets/ROADMAP_TEMPLATE.md` 和 `assets/BACKLOG_TEMPLATE.md`
- 需要追问脚本时看 `references/roadmap-dialogue.md`
- 需要定位 / 回写条目时用 `scripts/locate-roadmap-item.sh` 和 `scripts/sync-roadmap-progress.sh`

## Force Reality First

至少逼清这 5 件事：

1. 这个项目真正服务谁
2. 用户今天用什么笨办法解决
3. 为什么他们现在就会想要这个东西
4. 最窄但最有穿透力的第一阶段是什么
5. 未来 6-12 个月产品会自然长成什么样

## Route Shapes

- `wedge-first`: 用一个极窄切口先打穿真实需求
- `platform-first`: 先搭通后续阶段复用的关键底座
- `rescue-first`: 先解决当前最大的 adoption / trust / delivery 卡点

推荐时必须回答：为什么这条主线比其他两条更值得先打。

## Output Contract

`ROADMAP.md`
- 1-3 个阶段
- 每阶段目标
- 每阶段存在原因
- 每阶段 exit signal
- 非目标

`BACKLOG.md`
- 只保留会真的进入下一轮 `req-plan` 的事项
- 每项注明来源阶段、优先级、当前未知点

## Exit Rule

只有当第一批 requirement 能从阶段主线自然长出来时，`roadmap` 才算完成。
