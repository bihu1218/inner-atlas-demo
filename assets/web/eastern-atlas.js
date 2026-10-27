/* 东方星图 EASTERN CHART v2.0 —— 自包含模块
 * 计算引擎：iztro (MIT) 本地运行，不上传任何数据。
 * 底层逻辑完整接入：十二宫布局 + 十四主星 + 主星亮度 + 辅星（六吉六煞禄存天马） + 四化 + 三方四正联动 + 身宫。
 * 对外只出现天赋语言，不出现命理术语。
 */
(function () {
  'use strict';

  /* ---------- 商业化配置：价格与解锁码（改这里就行） ---------- */
  var PRICE = '99';                        /* 一次性解锁价格 */
  var UNLOCK_CODES = ['ATLAS-2026'];       /* 内置兑换码；也接受 EA-1234-5678 格式（演示规则） */
  function unlocked() {
    try { return localStorage.getItem('eaUnlocked') === '1'; } catch (e) { return false; }
  }

  /* ---------- 词典：宫位 → 天赋区 ---------- */
  var AREA = {
    '命': { t: '本命天赋', d: '你身上最核心的底色，走路带风的那一面。' },
    '兄弟': { t: '同伴协作', d: '你和同伴、搭档互相成就的方式。' },
    '夫妻': { t: '亲密共鸣', d: '亲密关系里，你给出去和想收到的东西。' },
    '子女': { t: '创造培育', d: '你的创造力，以及照顾作品和后辈的方式。' },
    '财帛': { t: '价值创造', d: '你创造价值背后的天赋与态度。' },
    '疾厄': { t: '精力续航', d: '你的身体节奏、情绪容器和恢复力。' },
    '迁移': { t: '远方机会', d: '走出熟悉的环境，机会和舞台在哪。' },
    '仆役': { t: '贵人网络', d: '朋友、人脉，和愿意拉你一把的人。' },
    '官禄': { t: '事业发力', d: '最适合你发力的领域和做事姿态。' },
    '田宅': { t: '安定根基', d: '你的家、环境与安全感的来源。' },
    '福德': { t: '心灵滋养', d: '什么真正让你放松、回血、觉得值得。' },
    '父母': { t: '师承引路', d: '长辈、老师和榜样给你的托举。' }
  };
  function areaKey(name) { return String(name || '').replace(/宫$/, ''); }

  /* ---------- 词典：十四主星 → 天赋星 ---------- */
  var STAR = {
    '紫微': { a: '领航星', s: '统筹', d: '天生一股掌舵的气场，喜欢把零散的事统筹成一盘清晰的棋。', act: '主动牵头做一次小分工，把一件事从头到尾安排明白。' },
    '天机': { a: '谋略星', s: '点子', d: '脑子转得快，擅长拆解复杂问题、找到巧办法。', act: '遇到难题先写下三种解法再动手，练一次。' },
    '太阳': { a: '暖阳星', s: '感染力', d: '愿意站出来照亮别人，人群里自带热度。', act: '这周主动在群里分享一次你擅长的经验。' },
    '武曲': { a: '执行星', s: '结果', d: '说干就干，对数字、结果和效率格外敏感。', act: '挑一件拖了很久的事，今天做完它。' },
    '天同': { a: '乐天星', s: '松弛', d: '亲和松弛，天生会把气氛带舒服的人。', act: '组织一次轻松的聚餐或散步，当一回气氛组。' },
    '廉贞': { a: '原则星', s: '底线', d: '有底线也有审美，认真起来绝不含糊。', act: '给自己最在意的一件事立一条规矩，守住一周。' },
    '天府': { a: '掌库星', s: '稳', d: '稳得住场，擅长把资源和局面打理得井井有条。', act: '把自己的时间安排或收支做一次大整理。' },
    '太阴': { a: '细腻星', s: '体贴', d: '感受细腻，照顾人于无声处，细节功夫一流。', act: '默默帮身边的人做一件小事，不声张。' },
    '贪狼': { a: '尝鲜星', s: '好奇', d: '好奇心旺，兴趣广，学什么都快。', act: '自学一个从没碰过的小技能，学满两小时。' },
    '巨门': { a: '表达星', s: '讲透', d: '口才好，爱琢磨真相，能把一个道理讲透。', act: '把你最懂的一件事讲给外行听，讲到他点头。' },
    '天相': { a: '辅弼星', s: '参谋', d: '最靠谱的参谋，擅长补位、协调和兜底。', act: '主动帮朋友把一件乱局理成一张清单。' },
    '天梁': { a: '长者星', s: '担当', d: '有担当，愿意照顾人，天然的信任感。', act: '给一个新人当一次顾问，帮他少走弯路。' },
    '七杀': { a: '冲锋星', s: '敢闯', d: '敢闯敢拼，越有挑战越来劲。', act: '主动认领一件没人敢碰的难活。' },
    '破军': { a: '开拓星', s: '破局', d: '不怕推倒重来，天生适合开新路。', act: '把一个旧流程整个推翻，用新办法重做一遍。' }
  };

  /* ---------- 词典：四化 → 位置标签 ---------- */
  var MUTA = {
    '禄': { cls: 't-lu', t: '机会位', d: '这个区容易遇到顺水推舟的运气。' },
    '权': { cls: 't-quan', t: '发力位', d: '这个区越练越有分量，适合主动扛事。' },
    '科': { cls: 't-ke', t: '口碑位', d: '这个区容易被记住、被夸，是你的名片。' },
    '忌': { cls: 't-ji', t: '磨炼位', d: '这个区前期费劲，练出来就是你的护城河。' }
  };

  /* ---------- 词典：主星亮度 → 星势三档 ---------- */
  var BRI = {
    '庙': { t: '势强', d: '这颗星在你身上是满格状态，是天生拿得出手的本事。' },
    '旺': { t: '势强', d: '这颗星在你身上是满格状态，是天生拿得出手的本事。' },
    '得': { t: '势稳', d: '这颗星状态稳定，认真用就能稳定输出。' },
    '利': { t: '势稳', d: '这颗星状态稳定，认真用就能稳定输出。' },
    '平': { t: '待养', d: '这颗星还在攒劲，多经历多练习就会越来越亮。' },
    '不': { t: '待养', d: '这颗星还在攒劲，多经历多练习就会越来越亮。' },
    '陷': { t: '待养', d: '这颗星还在攒劲，多经历多练习就会越来越亮。' }
  };
  function briMeta(b) { return BRI[b] || { t: '势稳', d: '这颗星状态稳定，认真用就能稳定输出。' }; }

  /* ---------- 词典：辅星 → 同行星 ---------- */
  var AUX = {
    '左辅': { a: '搭手星', d: '做事容易有人搭把手，协作里天生不吃亏。' },
    '右弼': { a: '搭手星', d: '做事容易有人搭把手，协作里天生不吃亏。' },
    '天魁': { a: '提携星', d: '关键时刻常有人拉你一把，长辈缘好。' },
    '天钺': { a: '提携星', d: '关键时刻常有人拉你一把，长辈缘好。' },
    '文昌': { a: '才思星', d: '写和表达的才气，能把想法落在纸面上。' },
    '文曲': { a: '才思星', d: '写和表达的才气，能把想法落在纸面上。' },
    '禄存': { a: '厚积星', d: '稳稳攒资源的本事，慢但是牢。' },
    '天马': { a: '奔走星', d: '机会在跑动中来，越动越旺。' },
    '擎羊': { a: '磨砺星', d: '这区费劲，但磨出来的都是真本事。' },
    '陀罗': { a: '磨砺星', d: '这区费劲，但磨出来的都是真本事。' },
    '火星': { a: '火花星', d: '来得快的爆发力，急性子里藏着急智。' },
    '铃星': { a: '火花星', d: '来得快的爆发力，急性子里藏着急智。' },
    '地空': { a: '留白星', d: '想法天马行空，落地前先挑一件最值得的。' },
    '地劫': { a: '留白星', d: '想法天马行空，落地前先挑一件最值得的。' }
  };

  /* ---------- 地支 → 4x4 网格位置（0-15，5/6/9/10 为中心） ---------- */
  var CELL = { '巳': 0, '午': 1, '未': 2, '申': 3, '辰': 4, '酉': 7, '卯': 8, '戌': 11, '寅': 12, '丑': 13, '子': 14, '亥': 15 };

  var TIME_OPTIONS = [
    [6, '不确定（按正午算）'],
    [0, '深夜 0–1 点'], [1, '凌晨 1–3 点'], [2, '清晨 3–5 点'], [3, '早晨 5–7 点'],
    [4, '早上 7–9 点'], [5, '上午 9–11 点'], [7, '下午 13–15 点'], [8, '傍晚 15–17 点'],
    [9, '黄昏 17–19 点'], [10, '晚间 19–21 点'], [11, '深夜 21–23 点'], [12, '午夜 23–24 点']
  ];

  function $(id) { return document.getElementById(id); }

  function starMeta(name) {
    return STAR[name] || { a: name, s: '', d: '一颗安静的星，陪你慢慢发光。', act: '先把这一区记下来，观察自己什么时候用到它。' };
  }

  function ensureTimeOptions() {
    var sel = $('eaTime');
    if (!sel || sel.options.length) return;
    TIME_OPTIONS.forEach(function (o) {
      var op = document.createElement('option');
      op.value = o[0]; op.textContent = o[1];
      sel.appendChild(op);
    });
  }

  /* ---------- 生成 ---------- */
  function generate(dateStr, timeIndex, nickname) {
    if (!window.iztro || !window.iztro.astro) {
      $('eaError').textContent = '星区引擎没有加载成功，请检查网络后重试。';
      return;
    }
    var chart;
    try {
      chart = window.iztro.astro.bySolar(dateStr, Number(timeIndex), '男');
    } catch (e) {
      $('eaError').textContent = '这个日期算不出来，换一个日期试试。';
      return;
    }
    $('eaError').textContent = '';

    /* 主天赋星 */
    var soulName = chart.soul || '紫微';
    var soul = starMeta(soulName);
    $('eaSoulName').textContent = soul.a + ' · ' + soul.s;
    $('eaSoulDesc').textContent = soul.d;
    $('eaMeta').textContent =
      (nickname ? nickname + ' · ' : '') + dateStr + ' 出生 · 十二星区已生成';

    /* 收集宫位数据（含亮度、辅星、三方四正联动） */
    var palaces = chart.palaces || [];
    var data = palaces.map(function (p, i) {
      var area = AREA[areaKey(p.name)] || { t: '探索区', d: '' };
      var stars = (p.majorStars || []).map(function (s) {
        return { name: s.name, muta: s.mutagen || '', bri: s.brightness || '' };
      });
      var auxSeen = {};
      var aux = (p.minorStars || []).filter(function (s) {
        return AUX[s.name] && !auxSeen[AUX[s.name].a] && (auxSeen[AUX[s.name].a] = 1);
      }).map(function (s) { return AUX[s.name]; });
      var borrowed = false;
      if (!stars.length) {
        var opp = palaces[(i + 6) % 12];
        stars = ((opp && opp.majorStars) || []).map(function (s) {
          return { name: s.name, muta: '', bri: s.brightness || '' };
        });
        borrowed = true;
      }
      return {
        area: area, key: areaKey(p.name), stars: stars, aux: aux, borrowed: borrowed,
        isBody: !!p.isBodyPalace, branch: p.earthlyBranch, idx: i
      };
    });
    LAST_DATA = data;

    renderGrid(data);
    $('eaResult').hidden = false;
    $('eaResult').dataset.summary = buildSummary(nickname, dateStr, soul, data);
    /* 默认展开主区 */
    var soulArea = data.filter(function (x) { return x.key === '命'; })[0];
    if (soulArea) showDetail(soulArea, null);
  }

  var LAST_DATA = [];

  function renderGrid(data) {
    var grid = $('eaGrid');
    grid.innerHTML = '';
    var cells = new Array(16).fill(null);
    data.forEach(function (p) { if (CELL[p.branch] !== undefined) cells[CELL[p.branch]] = p; });

    cells.forEach(function (p, idx) {
      var isCenter = (idx === 5 || idx === 6 || idx === 9 || idx === 10);
      if (isCenter && idx !== 5) return; /* 中心只画一次 */
      if (isCenter) {
        var center = document.createElement('div');
        center.className = 'eastern-center';
        var soulName = document.querySelector('#eaSoulName').textContent.split(' · ')[0];
        center.innerHTML = '<span class="ec-kicker">你的主天赋星</span><span class="ec-big">' + soulName + '</span><span class="ec-sub">点旁边的区域，看每一处怎么发力。</span>';
        grid.appendChild(center);
        return;
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'eastern-cell';
      var html = '<span class="ec-domain">' + (p ? p.area.t : '—') + '</span>';
      if (p) {
        var locked = !unlocked() && p.key !== '命';
        html += '<span class="ec-star">' + p.stars.map(function (s) {
          return starMeta(s.name).a + '<i class="ec-pot">' + briMeta(s.bri).t + '</i>';
        }).join(' · ');
        if (p.borrowed) html += '<span class="ec-borrow">由对区照亮</span>';
        html += '</span><span class="ec-tags">';
        p.stars.forEach(function (s) {
          if (s.muta && MUTA[s.muta]) html += '<span class="ec-tag ' + MUTA[s.muta].cls + '">' + MUTA[s.muta].t + '</span>';
        });
        p.aux.forEach(function (m) {
          html += '<span class="ec-tag t-aux">' + m.a + '</span>';
        });
        if (p.isBody) html += '<span class="ec-tag t-body">后天发力</span>';
        if (locked) html += '<span class="ec-tag t-pro">完整版</span>';
        html += '</span>';
        btn.addEventListener('click', function () {
          if (locked) showLockedDetail(p, btn); else showDetail(p, btn);
        });
      } else {
        html += '<span class="ec-star">—</span>';
      }
      btn.innerHTML = html;
      grid.appendChild(btn);
    });
  }

  /* ---------- 免费版：锁定区详情 → 引导解锁 ---------- */
  var LAST_LOCKED = null;
  function showLockedDetail(p, btn) {
    LAST_LOCKED = p;
    var box = $('eaDetail');
    document.querySelectorAll('.eastern-cell.active').forEach(function (c) { c.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var starNames = p.stars.map(function (s) { return starMeta(s.name).a; }).join('、');
    var lines = '<span class="section-kicker">' + p.area.t + ' EASTERN AREA</span><h3>' + p.area.t + '</h3><p>' + p.area.d + '</p>';
    lines += '<div class="ed-block"><span class="ed-label">这里的星</span><p>' + starNames + '……</p></div>';
    lines += '<div class="ed-block ea-teaser"><span class="ed-label">这区完整解读包含</span><p>' +
      '这颗星在你身上是强是稳还是待养、和它同行的星、给这区供能的三个联动区，以及配套的起步动作。</p></div>';
    lines += '<div class="ed-action ea-cta"><p><b>你只看到了一半。</b>剩下的 11 个区域，藏着你的价值创造、贵人网络和心灵滋养。</p>' +
      '<button class="primary" id="eaBuyBtn" type="button">¥' + PRICE + ' 一次性解锁全部十二区 ↗</button>' +
      '<p class="small muted">不用订阅，解锁一次永久可看。</p></div>';
    box.innerHTML = lines;
    box.hidden = false;
    var buy = document.getElementById('eaBuyBtn');
    if (buy) buy.addEventListener('click', openPayDialog);
  }

  /* ---------- 解锁弹窗：支付位 + 兑换码 ---------- */
  function openPayDialog() {
    var dlg = $('eaPayDialog');
    if (!dlg) return;
    var already = dlg.dataset.built === '1';
    if (!already) {
      dlg.innerHTML = '<button class="secondary dialog-close" id="eaPayClose" style="float:right">✕</button>' +
        '<span class="section-kicker">UNLOCK FULL CHART</span><h3 style="margin:6px 0 10px">解锁你的完整东方星图</h3>' +
        '<ul class="ea-pay-list"><li>全部 12 个区域的完整解读与起步动作</li><li>每颗天赋星的星势强弱（强／稳／待养）</li><li>同行星与三方联动的完整分析</li><li>可复制的完整文字报告</li></ul>' +
        '<p style="font-size:22px;font-weight:700">¥' + PRICE + ' <span class="small muted" style="font-weight:400">一次性，永久可看</span></p>' +
        '<div class="ea-qr ea-qr-real"><img src="assets/web/ea-pay-qr.jpg" alt="微信收款码"></div>' +
        '<label class="small muted" for="eaCode">支付后输入激活码</label>' +
        '<div class="ea-pay-row"><input id="eaCode" maxlength="24" placeholder="例如 ATLAS-2026" autocomplete="off"><button class="primary" id="eaUnlockBtn" type="button">解锁 ↗</button></div>' +
        '<p id="eaPayError" class="error" role="alert"></p>';
      dlg.dataset.built = '1';
      $('eaPayClose').addEventListener('click', function () { dlg.close(); });
      $('eaUnlockBtn').addEventListener('click', tryUnlock);
      $('eaCode').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryUnlock(); });
    }
    $('eaPayError').textContent = '';
    if (typeof dlg.showModal === 'function') dlg.showModal();
  }

  function tryUnlock() {
    var v = ($('eaCode').value || '').trim().toUpperCase();
    if (!v) { $('eaPayError').textContent = '先输入激活码。'; return; }
    if (UNLOCK_CODES.indexOf(v) === -1 && !/^EA-\d{4}-\d{4}$/.test(v)) {
      $('eaPayError').textContent = '激活码不对，核对后再试。';
      return;
    }
    try { localStorage.setItem('eaUnlocked', '1'); } catch (e) { }
    $('eaPayDialog').close();
    renderGrid(LAST_DATA);
    var target = LAST_LOCKED || LAST_DATA.filter(function (x) { return x.key === '命'; })[0];
    if (target) showDetail(target, null);
  }

  function showDetail(p, btn) {
    var box = $('eaDetail');
    document.querySelectorAll('.eastern-cell.active').forEach(function (c) { c.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var links = [(p.idx + 4) % 12, (p.idx + 8) % 12, (p.idx + 6) % 12]
      .map(function (j) { return LAST_DATA[j]; })
      .filter(Boolean);
    var lines = '<span class="section-kicker">' + p.area.t + ' EASTERN AREA</span><h3>' + p.area.t + '</h3><p>' + p.area.d + '</p>';
    p.stars.forEach(function (s) {
      var m = starMeta(s.name);
      var bm = briMeta(s.bri);
      lines += '<div class="ed-block"><span class="ed-label">' + m.a + ' · ' + m.s + '（星势：' + bm.t + '）' + (p.borrowed ? '（由对区照亮）' : '') + '</span><p>' + m.d + '</p><p class="small muted">' + bm.d + '</p></div>';
    });
    if (p.aux && p.aux.length) {
      lines += '<div class="ed-block"><span class="ed-label">同行星 · 陪你这一区的星</span>';
      p.aux.forEach(function (m) {
        lines += '<p><b>' + m.a + '</b>：' + m.d + '</p>';
      });
      lines += '</div>';
    }
    if (p.stars.length) {
      var act = starMeta(p.stars[0].name).act;
      lines += '<div class="ed-block"><span class="ed-label">起步动作 · 这周就可以做</span><div class="ed-action"><p>' + act + '</p></div></div>';
    }
    var mutas = p.stars.filter(function (s) { return s.muta && MUTA[s.muta]; });
    mutas.forEach(function (s) {
      lines += '<div class="ed-block"><span class="ed-label">' + MUTA[s.muta].t + '</span><p>' + MUTA[s.muta].d + '</p></div>';
    });
    if (links.length === 3) {
      lines += '<div class="ed-block"><span class="ed-label">联动区 · 给这区供能的三个地方</span><p class="ed-links">' +
        links.map(function (q, k) {
          return '<button type="button" class="ed-link" data-lidx="' + k + '">' + q.area.t + ' ↗</button>';
        }).join('') + '</p><p class="small muted">东方星区的看法：一个区不是孤立的，这三个区的星会持续给它供能。</p></div>';
    }
    box.innerHTML = lines;
    box.hidden = false;
    box.querySelectorAll('.ed-link').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = links[Number(b.dataset.lidx)];
        if (q) showDetail(q, null);
      });
    });
  }

  function buildSummary(nickname, dateStr, soul, data) {
    var lines = [];
    lines.push('【东方星图 · ' + (nickname || '探索者') + '】' + dateStr + ' 出生');
    lines.push('主天赋星：' + soul.a + '（' + soul.s + '）' + soul.d);
    data.forEach(function (p) {
      var names = p.stars.map(function (s) { return starMeta(s.name).a + '（' + briMeta(s.bri).t + '）'; }).join('、');
      if (!names) return;
      var auxNames = (p.aux || []).map(function (m) { return m.a; }).join('、');
      lines.push(p.area.t + '：' + names + (auxNames ? ' ＋ ' + auxNames : '') + (p.borrowed ? '（对区照亮）' : ''));
    });
    lines.push('—— 仅供娱乐与自我探索，不能决定你的能力或人生方向。');
    return lines.join('\n');
  }

  /* ---------- 页面开关 ---------- */
  function showPage() {
    var sections = document.querySelectorAll('#main > section.page');
    sections.forEach(function (s) { if (s.id !== 'eaPage') s.hidden = true; });
    var footer = document.querySelector('#main footer');
    if (footer) footer.hidden = true;
    $('eaPage').hidden = false;
    var label = $('pageLabel');
    if (label) label.textContent = '东方星图';
    document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
    var mine = $('eaNav');
    if (mine) mine.classList.add('active');
    ensureTimeOptions();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
  }

  function hidePage() {
    $('eaPage').hidden = true;
    var footer = document.querySelector('#main footer');
    if (footer) footer.hidden = false;
    var nav = document.querySelector('.nav-item[data-page]');
    if (nav) nav.click();
  }

  function boot() {
    try { bootInner(); } catch (e) {
      var err = $('eaError');
      if (err) err.textContent = '模块初始化失败：' + (e && e.message ? e.message : e);
      if (window.console) console.error('[eastern]', e);
    }
  }

  function bootInner() {
    if (!$('eaPage') || $('eaPage').dataset.booted) return;
    $('eaPage').dataset.booted = '1';
    var EP = $('eaPage');
    function mark(s) { EP.dataset.step = s; }

    /* 时辰下拉 */
    mark('time');
    ensureTimeOptions();

    /* 解锁弹窗容器 */
    if (!$('eaPayDialog')) {
      var dlg = document.createElement('dialog');
      dlg.id = 'eaPayDialog';
      EP.appendChild(dlg);
    }

    /* 我的导航按钮：捕获阶段拦下，不让主程序处理 */
    var nav = $('eaNav');
    mark('nav');
    if (nav) {
      document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('#eaNav')) {
          e.stopPropagation();
          e.preventDefault();
          showPage();
        }
      }, true);
    }

    /* 别的导航被点时，收起我的页面 */
    document.addEventListener('click', function (e) {
      if ($('eaPage').hidden) return;
      var t = e.target.closest ? e.target.closest('.nav-item:not(#eaNav), .space-link, #returnGalaxyHome') : null;
      if (t) hidePage();
    }, false);

    /* 表单 */
    mark('form');
    $('eaForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = $('eaDate').value;
      if (!d) { $('eaError').textContent = '先填出生日期。'; return; }
      generate(d, $('eaTime').value, $('eaWho').value.trim());
    });

    /* 复制摘要 */
    mark('copy');
    $('eaCopy').addEventListener('click', function () {
      var text = $('eaResult').dataset.summary || '';
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
        $('eaCopy').textContent = '已复制 ✓';
        setTimeout(function () { $('eaCopy').textContent = '复制文字摘要'; }, 1800);
      }).catch(function () {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); $('eaCopy').textContent = '已复制 ✓'; } catch (err) { }
        document.body.removeChild(ta);
        setTimeout(function () { $('eaCopy').textContent = '复制文字摘要'; }, 1800);
      });
    });

    /* 分享链接直达：?eastern=1&ed=1990-08-16&et=6&en=称呼 */
    mark('url');
    try {
      var q = new URLSearchParams(location.search);
      /* 测试开关：&unlocked=1 模拟已解锁；&locked=1 清除解锁 */
      if (q.get('unlocked') === '1') { try { localStorage.setItem('eaUnlocked', '1'); } catch (e) { } }
      if (q.get('locked') === '1') { try { localStorage.removeItem('eaUnlocked'); } catch (e) { } }
      if (q.get('eastern') === '1') {
        showPage();
        mark('shown');
        if (q.get('ed')) {
          $('eaDate').value = q.get('ed');
          if (q.get('et')) $('eaTime').value = q.get('et');
          if (q.get('en')) $('eaWho').value = q.get('en');
          generate($('eaDate').value, $('eaTime').value || 6, $('eaWho').value.trim());
          mark('generated');
          if (q.get('pay') === '1') openPayDialog(); /* 测试开关：直接弹解锁框 */
        }
      }
    } catch (e) { }
  }

  /* 等主程序（defer app.js）初始化完再启动，避免被覆盖 */
  if (document.readyState === 'complete') setTimeout(boot, 400);
  else window.addEventListener('load', function () { setTimeout(boot, 400); });
})();
