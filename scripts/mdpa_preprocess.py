#!/usr/bin/env python3
"""
MDPA Personality Test — Data Preprocessing Script
Reads a raw JSON result file and produces structured per-dimension analysis files
for downstream agent consumption.

Usage: python3 scripts/mdpa_preprocess.py <result_json_file>
Output: scripts/mdpa_processed/<resultId>/  (one JSON per dimension + overview)
"""

import json, sys, os, statistics
from pathlib import Path
from collections import defaultdict

# OCEAN ↔ MBTI mapping
OCEAN_MBTI_MAP = {
    "E": "EI",   # Extraversion ↔ E-I
    "O": "NS",   # Openness ↔ N-S
    "C": "JP",   # Conscientiousness ↔ J-P
    "A": "FT",   # Agreeableness ↔ F-T (loose)
    "N": None,   # Neuroticism has its own POL_N / N_SIT
}

DIMENSION_NAMES = {
    "O": "开放性 Openness",
    "C": "尽责性 Conscientiousness",
    "E": "外向性 Extraversion",
    "A": "宜人性 Agreeableness",
    "N": "神经质 Neuroticism",
}

MBTI_POLE_LABELS = {
    "EI": {"low": "I 内向", "high": "E 外向"},
    "NS": {"low": "S 实感", "high": "N 直觉"},
    "FT": {"low": "T 思考", "high": "F 情感"},
    "JP": {"low": "P 感知", "high": "J 判断"},
}

N_CLUSTER_NAMES = {
    "ar": "分析反刍 Analytical Rumination",
    "sv": "压力脆弱 Stress Vulnerability",
    "er": "情绪反应 Emotional Reactivity",
}

# N_SIT and POL_N items → sub-cluster mapping (from test design)
N_ITEM_CLUSTER_MAP = {
    "N_SIT_01": "ar", "N_SIT_02": "ar", "N_SIT_04": "ar", "N_SIT_05": "ar",
    "POL_N_01": "ar", "POL_N_02": "ar",
    "N_SIT_03": "sv", "N_SIT_06": "sv",
    "POL_N_03": "sv", "POL_N_04": "sv",
    "N_SIT_07": "er", "N_SIT_08": "er",
    "POL_N_05": "er", "POL_N_06": "er",
}

# SIT scenario text (from test design, not saved in rawResponses)
SIT_SCENARIOS = {
    "SIT_001": {"domain": "学业", "scenario": "选修课要做课堂展示，你可以自选主题。"},
    "SIT_002": {"domain": "学业", "scenario": "老师布置了一个开放性很强的论文题目，没有标准答案。"},
    "SIT_003": {"domain": "学业", "scenario": "小组作业分工，你会主动选什么角色？"},
    "SIT_004": {"domain": "学业", "scenario": "你读到一篇课程材料，里面很多术语看不懂。"},
    "SIT_005": {"domain": "学业", "scenario": "期中考完了，成绩还没出。"},
    "SIT_006": {"domain": "学业", "scenario": "小组讨论时，你有一个和大多数人不同的想法。"},
    "SIT_007": {"domain": "学业", "scenario": "新学期有几个学分的选修余量。"},
    "SIT_008": {"domain": "学业", "scenario": "作业分数比预期低，觉得有几处扣分不太合理。"},
    "SIT_009": {"domain": "社交", "scenario": "好朋友过生日，你在想送什么礼物。"},
    "SIT_010": {"domain": "社交", "scenario": "你去参加一个活动，发现基本都是不认识的人。"},
    "SIT_011": {"domain": "社交", "scenario": "和朋友聊天时意见不合，气氛有点僵。"},
    "SIT_012": {"domain": "社交", "scenario": "你在网上看到一个有意思的线下活动。"},
    "SIT_013": {"domain": "社交", "scenario": "朋友借了钱，说好一周还但已经两周了。"},
    "SIT_014": {"domain": "社交", "scenario": "几个朋友聚餐选餐厅，意见完全不统一。"},
    "SIT_015": {"domain": "日常", "scenario": "周末完全没有安排，一整天自由时间。"},
    "SIT_016": {"domain": "日常", "scenario": "你的房间已经乱了好几天了。"},
    "SIT_017": {"domain": "日常", "scenario": "外卖APP推荐了一道没听说过的异国料理。"},
    "SIT_018": {"domain": "日常", "scenario": "暑假有两周没什么安排。"},
    "SIT_019": {"domain": "日常", "scenario": "晚上躺在床上一时睡不着。"},
    "SIT_020": {"domain": "日常", "scenario": "早上闹钟响了，还有点困。"},
    "SIT_021": {"domain": "数字", "scenario": "刷到一个有争议的话题，评论区吵得很激烈。"},
    "SIT_022": {"domain": "数字", "scenario": "整理手机相册，发现很多以前的照片。"},
    "SIT_023": {"domain": "数字", "scenario": "看剧时一个片段特别触动你。"},
    "SIT_024": {"domain": "数字", "scenario": "发了一条朋友圈，一小时了一个赞都没有。"},
    "SIT_025": {"domain": "数字", "scenario": "你注册了一个新的社交平台。"},
    "SIT_026": {"domain": "变化", "scenario": "朋友临时取消了周末约好的安排。"},
    "SIT_027": {"domain": "变化", "scenario": "电脑死机了，写了一小时的东西没保存。"},
    "SIT_028": {"domain": "变化", "scenario": "导师突然问你要不要参加新的研究项目。"},
    "SIT_029": {"domain": "变化", "scenario": "意外收到一笔奖学金/红包。"},
    "SIT_030": {"domain": "变化", "scenario": "有机会去另一个城市交换学习一学期。"},
    "SIT_031": {"domain": "冲突", "scenario": "小组作业有队友一直没动静，快到截止日了。"},
    "SIT_032": {"domain": "冲突", "scenario": "室友很晚了还在外放音乐，你想睡觉。"},
    "SIT_033": {"domain": "冲突", "scenario": "你做了一个重要决定，身边有人不太认同。"},
    "SIT_034": {"domain": "冲突", "scenario": "好几门课的截止日撞在同一天。"},
    "SIT_035": {"domain": "冲突", "scenario": "两个好朋友闹矛盾了，都来找你吐槽对方。"},
    "SIT_036": {"domain": "独处", "scenario": "有一笔预算犒劳自己买一件东西。"},
    "SIT_037": {"domain": "独处", "scenario": "考虑要不要学一项新技能（编程、摄影、乐器等）。"},
    "SIT_038": {"domain": "独处", "scenario": "深夜脑子里突然开始想一些人生大问题。"},
    "SIT_039": {"domain": "独处", "scenario": "刷到一篇观点和你完全相反的文章。"},
    "SIT_040": {"domain": "活动", "scenario": "朋友约你尝试一项没玩过的运动。"},
    "SIT_041": {"domain": "活动", "scenario": "天气特别好，一整个下午都空着。"},
    "SIT_042": {"domain": "活动", "scenario": "走在路上，前面有人掉了东西没注意到。"},
    "SIT_043": {"domain": "审美", "scenario": "你在布置生活空间（寝室/书桌/手机主屏）。"},
    "SIT_044": {"domain": "审美", "scenario": "做了一个自己很满意的作品。"},
    "SIT_045": {"domain": "金钱", "scenario": "月底钱有点紧，但朋友约你吃一顿好的。"},
}

# ATT (attention check) scenario text
ATT_SCENARIOS = {
    "ATT_001": {"domain": "学业", "scenario": "你正在赶一篇明天要交的论文，已经写了大半。", "type": "trap"},
    "ATT_002": {"domain": "学业", "scenario": "考试刚考完，成绩要过几天才出。", "type": "repeat", "ref": "SIT_005"},
    "ATT_003": {"domain": "日常", "scenario": "闹钟响了，还有点困。", "type": "repeat", "ref": "SIT_020"},
}

# AV anchor vignette descriptions (from test design)
AV_ANCHORS = {
    "AV_E_01": {"anchor_name": "小明", "anchor_desc": "每周至少约两次朋友，聚会上喜欢和陌生人聊天。"},
    "AV_E_02": {"anchor_name": "小红", "anchor_desc": "经常和朋友见面，熟人面前很健谈。"},
    "AV_O_01": {"anchor_name": "小杰", "anchor_desc": "看不同类型的书，选课选专业外的，旅行去没人推荐的地方。"},
    "AV_O_02": {"anchor_name": "小航", "anchor_desc": "总有新奇点子，喜欢从不同角度看问题。"},
    "AV_C_01": {"anchor_name": "小李", "anchor_desc": "考前一周就按计划复习，笔记分类清楚，从不迟交。"},
    "AV_C_02": {"anchor_name": "小慧", "anchor_desc": "做事前一定有完整计划，严格按步骤来。"},
    "AV_A_01": {"anchor_name": "小林", "anchor_desc": "有分歧时通常让步，朋友有困难总第一个帮。"},
    "AV_A_02": {"anchor_name": "小雨", "anchor_desc": "特别能体会别人感受，但有时把别人情绪背自己身上。"},
    "AV_N_01": {"anchor_name": "小张", "anchor_desc": "遇事情绪波动大，考试前明显焦虑，被批评后好几天释怀。"},
    "AV_N_02": {"anchor_name": "小琪", "anchor_desc": "做决定后常后悔，等结果时特别煎熬。"},
}

# RT threshold for likely AFK / distracted (in ms)
RT_AFK_THRESHOLD_MS = 60000


def load_data(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # rawResponses may be string or list
    if isinstance(data.get("rawResponses"), str):
        data["rawResponses"] = json.loads(data["rawResponses"])
    return data


def classify_responses(responses):
    """Group responses by module type and by OCEAN dimension."""
    by_module = defaultdict(list)
    by_dimension = defaultdict(list)  # key = O/C/E/A/N

    for r in responses:
        mod = r.get("mod", "")
        by_module[mod].append(r)

        # For SIT/ATT items: each option is tagged with a dimension
        if mod in ("SIT",):
            dims_in_item = set()
            for opt in r.get("opts", []):
                d = opt.get("D")
                if d and d in "OCEAN":
                    dims_in_item.add(d)
            for d in dims_in_item:
                by_dimension[d].append(r)

        # PAIR items: two options, each a dimension
        elif mod == "PAIR":
            for opt in r.get("opts", []):
                d = opt.get("D")
                if d and d in "OCEAN":
                    by_dimension[d].append(r)

        # AV items: tagged with dim
        elif mod == "AV":
            d = r.get("dim")
            if d:
                by_dimension[d].append(r)

        # POL items: MBTI polar, map to OCEAN
        elif mod == "POL":
            # figure out which MBTI axis from the item id
            item_id = r.get("id", "")
            for mbti_ax, ocean_dim in [("EI", "E"), ("NS", "O"), ("FT", "A"), ("JP", "C")]:
                if mbti_ax in item_id:
                    by_dimension[ocean_dim].append(r)
                    break

        # POL_N and N_SIT → Neuroticism
        elif mod in ("POL_N", "N_SIT"):
            by_dimension["N"].append(r)

    return by_module, by_dimension


def rt_stats(responses):
    """Compute reaction time statistics with outlier handling."""
    rts = [r["rt"] for r in responses if "rt" in r and r["rt"] > 0]
    if not rts:
        return {}
    rts_sec = [t / 1000 for t in rts]

    # Separate normal vs AFK responses
    normal_rts = [t for t in rts_sec if t <= RT_AFK_THRESHOLD_MS / 1000]
    afk_count = len(rts_sec) - len(normal_rts)

    sorted_rts = sorted(zip(rts_sec, [r.get("id", "?") for r in responses if "rt" in r and r["rt"] > 0]))

    result = {
        "count": len(rts_sec),
        "mean_sec": round(statistics.mean(rts_sec), 1),
        "median_sec": round(statistics.median(rts_sec), 1),
        "stdev_sec": round(statistics.stdev(rts_sec), 1) if len(rts_sec) > 1 else 0,
        "min_sec": round(min(rts_sec), 1),
        "max_sec": round(max(rts_sec), 1),
        "slowest_5": [{"id": sid, "sec": round(s, 1), "likely_afk": s > RT_AFK_THRESHOLD_MS / 1000} for s, sid in sorted_rts[-5:][::-1]],
        "fastest_5": [{"id": sid, "sec": round(s, 1)} for s, sid in sorted_rts[:5]],
    }

    # Add trimmed stats (excluding likely AFK responses)
    if normal_rts and afk_count > 0:
        result["trimmed_mean_sec"] = round(statistics.mean(normal_rts), 1)
        result["trimmed_median_sec"] = round(statistics.median(normal_rts), 1)
        result["trimmed_stdev_sec"] = round(statistics.stdev(normal_rts), 1) if len(normal_rts) > 1 else 0
        result["afk_count"] = afk_count
        result["afk_note"] = f"{afk_count} responses over {RT_AFK_THRESHOLD_MS // 1000}s excluded from trimmed stats (likely AFK/distracted)"

    return result


def analyze_sit_item(r, target_dim):
    """For a SIT item, extract where the target dimension's option was ranked."""
    ranking = r.get("ranking", [])
    opts = r.get("opts", [])
    item_id = r["id"]
    result = {
        "id": item_id,
        "rt_sec": round(r.get("rt", 0) / 1000, 1),
        "likely_afk": r.get("rt", 0) > RT_AFK_THRESHOLD_MS,
    }

    # Add scenario context from lookup
    scenario_info = SIT_SCENARIOS.get(item_id) or ATT_SCENARIOS.get(item_id)
    if scenario_info:
        result["scenario"] = scenario_info["scenario"]
        result["domain"] = scenario_info["domain"]

    for i, opt in enumerate(opts):
        if opt.get("D") == target_dim:
            rank_position = ranking[i] if i < len(ranking) else None
            result["option_text"] = opt["t"]
            result["option_index"] = i
            result["rank_given"] = rank_position  # 0 = top, 3 = bottom
            result["direction"] = opt.get("d", 1)
            result["is_positive"] = opt.get("d", 1) == 1
            # 0=best, 3=worst for positive items; reversed for negative
            if result["is_positive"]:
                result["favorable"] = rank_position <= 1 if rank_position is not None else None
            else:
                result["favorable"] = rank_position >= 2 if rank_position is not None else None
            break

    # Also capture all options for context
    result["all_options"] = []
    for i, opt in enumerate(opts):
        result["all_options"].append({
            "text": opt["t"],
            "dim": opt.get("D"),
            "dir": opt.get("d"),
            "rank": ranking[i] if i < len(ranking) else None,
        })

    return result


def analyze_pair_item(r, target_dim):
    """For a PAIR item, extract the choice relative to target dimension."""
    opts = r.get("opts", [])
    chosen = r.get("chosen", 0)
    result = {
        "id": r["id"],
        "rt_sec": round(r.get("rt", 0) / 1000, 1),
        "likely_afk": r.get("rt", 0) > RT_AFK_THRESHOLD_MS,
    }

    for i, opt in enumerate(opts):
        if opt.get("D") == target_dim:
            result["option_text"] = opt["t"]
            result["chose_this_dim"] = (chosen == i)
            result["competing_dim"] = opts[1 - i].get("D") if len(opts) == 2 else None
            result["competing_text"] = opts[1 - i].get("t") if len(opts) == 2 else None
            break

    return result


def analyze_pol_item(r):
    """For a POL/POL_N item, extract the choice."""
    opts = r.get("opts", [])
    chosen = r.get("chosen", 0)
    item_id = r.get("id", "")
    result = {
        "id": item_id,
        "rt_sec": round(r.get("rt", 0) / 1000, 1),
        "likely_afk": r.get("rt", 0) > RT_AFK_THRESHOLD_MS,
        "chosen_text": opts[chosen]["t"] if chosen < len(opts) else "?",
        "chosen_pole": opts[chosen].get("p", "?") if chosen < len(opts) else "?",
        "other_text": opts[1 - chosen]["t"] if len(opts) == 2 and (1 - chosen) < len(opts) else "?",
        "other_pole": opts[1 - chosen].get("p", "?") if len(opts) == 2 and (1 - chosen) < len(opts) else "?",
    }

    # Add N sub-cluster label if applicable
    cluster = N_ITEM_CLUSTER_MAP.get(item_id)
    if cluster:
        result["n_cluster"] = cluster
        result["n_cluster_name"] = N_CLUSTER_NAMES[cluster]

    return result


def analyze_av_item(r):
    """For an AV item, extract self-placement with anchor context."""
    item_id = r.get("id", "")
    result = {
        "id": item_id,
        "dim": r.get("dim"),
        "position": r.get("position"),  # 0-8 scale
        "rt_sec": round(r.get("rt", 0) / 1000, 1),
        "likely_afk": r.get("rt", 0) > RT_AFK_THRESHOLD_MS,
        "scale_description": "0 = 完全不像该人物, 8 = 完全像该人物",
    }

    # Add anchor vignette context
    anchor = AV_ANCHORS.get(item_id)
    if anchor:
        result["anchor_name"] = anchor["anchor_name"]
        result["anchor_desc"] = anchor["anchor_desc"]
        result["interpretation"] = (
            f"学生在0-8量表上将自己定位于{r.get('position')}，"
            f"参照对象「{anchor['anchor_name']}」的描述为：{anchor['anchor_desc']}"
        )

    return result


def analyze_n_sit_item(r):
    """For an N_SIT item, extract choice between neurotic/stable with cluster label."""
    opts = r.get("opts", [])
    chosen = r.get("chosen", 0)
    item_id = r.get("id", "")
    cluster = N_ITEM_CLUSTER_MAP.get(item_id)
    return {
        "id": item_id,
        "rt_sec": round(r.get("rt", 0) / 1000, 1),
        "likely_afk": r.get("rt", 0) > RT_AFK_THRESHOLD_MS,
        "chosen_text": opts[chosen]["t"] if chosen < len(opts) else "?",
        "chosen_pole": opts[chosen].get("p", "?") if chosen < len(opts) else "?",
        "chose_neurotic": opts[chosen].get("p") == "neurotic" if chosen < len(opts) else None,
        "other_text": opts[1 - chosen]["t"] if len(opts) == 2 and (1 - chosen) < len(opts) else "?",
        "n_cluster": cluster,
        "n_cluster_name": N_CLUSTER_NAMES.get(cluster, "") if cluster else None,
    }


def analyze_att_item(r):
    """For an ATT (attention check) item, analyze response quality."""
    item_id = r["id"]
    ranking = r.get("ranking", [])
    opts = r.get("opts", [])
    att_info = ATT_SCENARIOS.get(item_id, {})

    result = {
        "id": item_id,
        "rt_sec": round(r.get("rt", 0) / 1000, 1),
        "type": att_info.get("type", "unknown"),
        "scenario": att_info.get("scenario", ""),
    }

    if att_info.get("type") == "trap":
        # Trap item: the absurd option (D=null) should be ranked last (3)
        trap_idx = None
        for i, opt in enumerate(opts):
            if opt.get("D") is None:
                trap_idx = i
                break
        if trap_idx is not None and trap_idx < len(ranking):
            trap_rank = ranking[trap_idx]
            result["trap_option_text"] = opts[trap_idx]["t"]
            result["trap_rank"] = trap_rank
            result["passed"] = trap_rank == 3  # absurd option ranked last = passed

    elif att_info.get("type") == "repeat":
        # Repeat item: compare ranking consistency with reference SIT
        result["reference_sit"] = att_info.get("ref")

    result["all_options"] = []
    for i, opt in enumerate(opts):
        result["all_options"].append({
            "text": opt["t"],
            "dim": opt.get("D"),
            "rank": ranking[i] if i < len(ranking) else None,
        })

    return result


def build_dimension_data(dim, data, by_dimension, by_module):
    """Build complete analysis data for one OCEAN dimension."""
    items = by_dimension.get(dim, [])
    ocean_score = data.get("ocean", {}).get(dim)
    ocean_raw = data.get("oceanRaw", {}).get(dim)
    av_adj = data.get("avAdjustments", {}).get(dim)

    mbti_axis = OCEAN_MBTI_MAP.get(dim)
    mbti_score = data.get("mbtiStrength", {}).get(mbti_axis) if mbti_axis else None

    # Analyze each item type
    sit_analyses = []
    pair_analyses = []
    pol_analyses = []
    av_analyses = []
    n_sit_analyses = []

    for r in items:
        mod = r.get("mod", "")
        if mod == "SIT":
            # Skip ATT items from dimension analysis
            if r.get("id", "").startswith("ATT"):
                continue
            sit_analyses.append(analyze_sit_item(r, dim))
        elif mod == "PAIR":
            pair_analyses.append(analyze_pair_item(r, dim))
        elif mod in ("POL", "POL_N"):
            pol_analyses.append(analyze_pol_item(r))
        elif mod == "AV":
            av_analyses.append(analyze_av_item(r))
        elif mod == "N_SIT":
            n_sit_analyses.append(analyze_n_sit_item(r))

    # Consistency: for SIT items, count how many times this dim was ranked favorably
    sit_favorable = sum(1 for s in sit_analyses if s.get("favorable"))
    sit_total = sum(1 for s in sit_analyses if s.get("favorable") is not None)

    # For PAIR items, count choices toward this dim
    pair_chosen = sum(1 for p in pair_analyses if p.get("chose_this_dim"))
    pair_total = len(pair_analyses)

    result = {
        "dimension": dim,
        "dimension_name": DIMENSION_NAMES[dim],
        "scores": {
            "ocean_calibrated": ocean_score,
            "ocean_raw": ocean_raw,
            "av_adjustment": av_adj,
            "calibration_direction": "up" if (av_adj or 0) > 0 else "down" if (av_adj or 0) < 0 else "none",
        },
        "mbti_correspondence": {
            "axis": mbti_axis,
            "score": mbti_score,
            "pole_labels": MBTI_POLE_LABELS.get(mbti_axis, {}),
        } if mbti_axis else None,
        "item_summary": {
            "total_items": len(items),
            "sit_items": len(sit_analyses),
            "pair_items": len(pair_analyses),
            "pol_items": len(pol_analyses),
            "av_items": len(av_analyses),
            "n_sit_items": len(n_sit_analyses),
        },
        "consistency": {
            "sit_favorable_ratio": f"{sit_favorable}/{sit_total}" if sit_total > 0 else "N/A",
            "sit_favorable_pct": round(sit_favorable / sit_total * 100, 1) if sit_total > 0 else None,
            "pair_chosen_ratio": f"{pair_chosen}/{pair_total}" if pair_total > 0 else "N/A",
            "pair_chosen_pct": round(pair_chosen / pair_total * 100, 1) if pair_total > 0 else None,
        },
        "rt_stats": rt_stats(items),
        "sit_analyses": sit_analyses,
        "pair_analyses": pair_analyses,
        "pol_analyses": pol_analyses,
        "av_analyses": av_analyses,
        "n_sit_analyses": n_sit_analyses,
    }

    # Special: N dimension gets clusters with per-cluster item breakdowns
    if dim == "N":
        n_clusters_data = {}
        for k, v in (data.get("nClusters") or {}).items():
            cluster_items_neurotic = []
            cluster_items_stable = []
            # Collect items belonging to this cluster
            for item in n_sit_analyses:
                if item.get("n_cluster") == k:
                    if item.get("chose_neurotic"):
                        cluster_items_neurotic.append(item["id"])
                    else:
                        cluster_items_stable.append(item["id"])
            for item in pol_analyses:
                if item.get("n_cluster") == k:
                    if item.get("chosen_pole") == "neurotic":
                        cluster_items_neurotic.append(item["id"])
                    else:
                        cluster_items_stable.append(item["id"])

            total_cluster = len(cluster_items_neurotic) + len(cluster_items_stable)
            n_clusters_data[k] = {
                "score": v,
                "name": N_CLUSTER_NAMES.get(k, k),
                "total_items": total_cluster,
                "neurotic_choices": len(cluster_items_neurotic),
                "stable_choices": len(cluster_items_stable),
                "neurotic_item_ids": cluster_items_neurotic,
                "stable_item_ids": cluster_items_stable,
            }
        result["n_clusters"] = n_clusters_data

        # Also compute N raw score from behavioral data (since oceanRaw.N is null)
        if ocean_raw is None:
            n_total = len(n_sit_analyses) + len(pol_analyses)
            n_neurotic = sum(1 for i in n_sit_analyses if i.get("chose_neurotic"))
            n_neurotic += sum(1 for i in pol_analyses if i.get("chosen_pole") == "neurotic")
            if n_total > 0:
                result["scores"]["computed_raw_neurotic_ratio"] = round(n_neurotic / n_total, 3)
                result["scores"]["computed_raw_note"] = (
                    f"oceanRaw.N not available; computed from behavioral choices: "
                    f"{n_neurotic}/{n_total} neurotic choices ({round(n_neurotic/n_total*100, 1)}%)"
                )

    return result


def build_overview(data, by_module):
    """Build overview + behavioral analysis data."""
    responses = data["rawResponses"]

    # RT by module
    rt_by_module = {}
    for mod, items in by_module.items():
        stats = rt_stats(items)
        if stats:
            rt_by_module[mod] = stats

    # Overall RT
    overall_rt = rt_stats(responses)

    # Attention checks (ATT items)
    att_items = [r for r in responses if r.get("id", "").startswith("ATT")]
    att_analyses = [analyze_att_item(r) for r in att_items]

    # SIT domain distribution (how many items per life domain)
    domain_counts = defaultdict(int)
    for sid, info in SIT_SCENARIOS.items():
        domain_counts[info["domain"]] += 1

    return {
        "student": {
            "name": data.get("studentName", ""),
            "email": data.get("studentEmail", ""),
            "background": data.get("studentBackground", ""),
        },
        "test_meta": {
            "result_id": data.get("resultId", ""),
            "completed_at": data.get("completedAt", ""),
            "duration_seconds": data.get("durationSeconds"),
            "duration_minutes": round(data.get("durationSeconds", 0) / 60, 1),
            "total_questions": data.get("totalQuestions"),
            "quality_checks": data.get("qualityChecks", []),
        },
        "mbti": {
            "type": data.get("mbtiType", ""),
            "strengths": data.get("mbtiStrength", {}),
        },
        "ocean_summary": {
            dim: {
                "calibrated": data.get("ocean", {}).get(dim),
                "raw": data.get("oceanRaw", {}).get(dim),
                "adjustment": data.get("avAdjustments", {}).get(dim),
            }
            for dim in "OCEAN"
        },
        "n_clusters": data.get("nClusters", {}),
        "attention_checks": {
            "count": len(att_items),
            "analyses": att_analyses,
        },
        "behavioral_analysis": {
            "overall_rt": overall_rt,
            "rt_by_module": rt_by_module,
            "sit_domain_distribution": dict(domain_counts),
        },
        "rt_interpretation_guide": {
            "fast_response": "< 3s — high certainty, instinctive/automatic choice",
            "normal_response": "3-15s — deliberate consideration",
            "slow_response": "15-60s — significant internal conflict or careful weighing",
            "likely_afk": "> 60s — likely stepped away or distracted; treat RT as unreliable for this item",
        },
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/mdpa_preprocess.py <result_json_file>")
        sys.exit(1)

    input_path = sys.argv[1]
    data = load_data(input_path)
    result_id = data.get("resultId", "unknown")

    # Classify responses
    by_module, by_dimension = classify_responses(data["rawResponses"])

    # Output directory
    script_dir = Path(__file__).parent
    out_dir = script_dir / "mdpa_processed" / result_id
    out_dir.mkdir(parents=True, exist_ok=True)

    # Also save raw result for reference
    raw_path = out_dir / "raw_result.json"
    if not raw_path.exists():
        import shutil
        shutil.copy2(input_path, raw_path)
        print(f"  ✓ raw_result.json (copied)")

    # 1. Overview
    overview = build_overview(data, by_module)
    with open(out_dir / "00_overview.json", "w", encoding="utf-8") as f:
        json.dump(overview, f, ensure_ascii=False, indent=2)
    print(f"  ✓ 00_overview.json")

    # 2. Per-dimension files
    for dim in ["O", "C", "E", "A", "N"]:
        dim_data = build_dimension_data(dim, data, by_dimension, by_module)
        filename = f"dim_{dim}.json"
        with open(out_dir / filename, "w", encoding="utf-8") as f:
            json.dump(dim_data, f, ensure_ascii=False, indent=2)
        print(f"  ✓ {filename} ({dim_data['item_summary']['total_items']} items)")

    print(f"\nDone! Output in: {out_dir}")
    return str(out_dir)


if __name__ == "__main__":
    main()
