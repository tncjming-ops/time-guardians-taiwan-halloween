(() => {
  'use strict';
  const LEVELS=window.MCQ_LEVELS,KEY='time-guardian-mcq-v1';
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fresh=()=>({version:1,current:1,levels:{}});
  const freshLevel=id=>({started:false,index:0,selected:null,complete:false,answers:LEVELS[id-1].questions.map(()=>({passed:false,attempts:[],hint:0}))});
  const titles=['南瓜時空港','幽靈檔案館','黑貓街坊站','月光記憶村','星燈查證室','魔法課表屋','南瓜讀報社','糖果鐵道站','薄荷水路園','黑貓糖廠屋','星光生活城','月夜論證塔'];
  const symbols=['時','檔','訪','因','證','學','議','路','水','秤','城','論'];
  const badges=['時間排序','制度分析','權利觀察','因果辨識','多視角查證','教育比較','公民表達','運輸規劃','水路實驗','公平交易','生活調查','歷史論證'];
  let data=fresh(),warning='',mapOpen=true,celebrating=false;
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'null');
    if(raw){
      if(raw.version!==1||!Number.isInteger(raw.current)||raw.current<1||raw.current>12||!raw.levels||typeof raw.levels!=='object')throw Error('invalid');
      for(const [id,s]of Object.entries(raw.levels)){
        const level=LEVELS[Number(id)-1];
        if(!level||!s||!Number.isInteger(s.index)||s.index<0||s.index>=level.questions.length||!Array.isArray(s.answers)||s.answers.length!==level.questions.length||!s.answers.every(a=>a&&typeof a.passed==='boolean'&&Array.isArray(a.attempts)&&Number.isInteger(a.hint)&&a.hint>=0&&a.hint<=3&&a.attempts.every(t=>Number.isInteger(t.choice)&&t.choice>=0&&t.choice<4&&typeof t.correct==='boolean'))||typeof s.complete!=='boolean'||(s.complete&&!s.answers.every(a=>a.passed)))throw Error('invalid level');
      }
      data=raw;
    }
  }catch{warning='新版存檔無法讀取，已開啟新的選擇題進度。舊版存檔沒有刪除。';}
  const level=()=>LEVELS[data.current-1];
  const state=()=>data.levels[data.current] ||= freshLevel(data.current);
  const complete=id=>Boolean(data.levels[id]?.complete);
  const allowed=id=>Number.isInteger(id)&&id>=1&&id<=LEVELS.length;
  const totalDone=()=>LEVELS.filter(l=>complete(l.id)).length;
  const nextIncomplete=()=>LEVELS.find(l=>!complete(l.id))?.id;
  const passed=s=>s.answers.filter(a=>a.passed).length;
  const prelude=()=>Boolean(data.levels[12]?.answers.slice(0,4).every(a=>a.passed));
  function persist(){
    try{localStorage.setItem(KEY,JSON.stringify(data));$('save-status').textContent='進度已儲存在此瀏覽器';if(!warning)$('save-warning').hidden=true;}
    catch{warning='瀏覽器無法儲存進度。仍可繼續遊玩，請勿關閉頁面，關閉後可能遺失。';$('save-status').textContent='本機存檔失敗';}
    if(warning){$('save-warning').hidden=false;$('save-warning').textContent=warning;}
  }
  const cardData=()=>{
    const list=window.QUESTS.slice(0,10).map((q,i)=>{const t=q.card.replace(/^E\d+｜/,'');const j=t.indexOf('：');return {id:i+1,title:t.slice(0,j),text:t.slice(j+1),source:q.source,limit:['不代表所有人參加抵抗或政權延續到 1945 年。','不能把每項措施歸為唯一目的。','不能以一位居民代表全體感受。','不能將所有人都說成參加同一次武裝事件。','不能把被迫遷居說成自願，或刪除事件傷害。','機會增加不等於教育機會完全平等。','不能說已成立議會或選舉完全平等。','便利不等於所有權利限制消失。','不能把建設歸功於一人獨力完成。','重量示例與遊戲單價不能普遍化。'][i]};});
    return list.concat([
      {id:11,title:'衛生與生活',text:'供水、公共市場、醫療及宣導等改善生活與衛生觀念，平均壽命逐漸提高。',source:'T3：PDF 第 1–2 頁／課本第 24–25 頁',limit:'不代表每個人同步受益，也不能只歸因於單一措施。'},
      {id:12,title:'時間與休閒',text:'標準時間、休假制度影響守時與休閒，公園、電影、溫泉與戶外教育等興起。',source:'T3：PDF 第 3–4 頁／課本第 26–27 頁',limit:'不能推出人人都有同等休閒資源。'},
      {id:13,title:'多元文化',text:'日本文化、西洋風氣與臺灣傳統習俗交會，見於服飾、藝術、建築及飲食。',source:'T3：PDF 第 5 頁／課本第 28 頁',limit:'不能推出臺灣傳統全部消失。'},
      {id:14,title:'皇民化',text:'1937 年後透過獎勵與戰時物資分配等影響語言、姓名、信仰、服飾，強化對日本認同；各地成效不同，未完全同化。',source:'T3：PDF 第 6 頁／課本第 29 頁',limit:'不能說人人自願或完全同化。'},
      {id:15,title:'終章記錄',text:'1945 年日本戰敗，臺灣結束日本統治。',source:'T3：PDF 第 6 頁／課本第 29 頁的戰敗與日治終點脈絡',limit:'玩家修復認知，不是日本戰敗原因；不擴寫未附教材的戰後細節。'}
    ]);
  };
  const owned=()=>cardData().filter(c=>c.id<=10?complete(c.id):c.id<=13?complete(11):c.id===14?prelude():complete(12));
  const cardHTML=c=>`<article class="memory-card"><span class="card-no">E${String(c.id).padStart(2,'0')} ／ 教材摘要卡</span><div class="card-seal" aria-hidden="true">✦</div><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><p class="citation">${esc(c.source)}</p><p class="card-limit"><strong>使用限制：</strong>${esc(c.limit)}</p><small>插畫為遊戲裝飾，摘要不冒充原始史料。</small></article>`;
  function art(id,compact=false){
    const themes=[['#5b3b81','#ffdcb3'],['#6d528d','#e4d5ff'],['#4d5c83','#fbd0be'],['#665185','#ffe1a6'],['#45596e','#cce8df'],['#785c89','#ffe1af'],['#5b4a7d','#f5c4d8'],['#545183','#d2e7e1'],['#3d756e','#d6f0ca'],['#70506c','#ffd0a4'],['#68518b','#ffe1a2'],['#44335e','#e2d0ff']];
    const [bg,accent]=themes[id-1];
    const prop=[
      '<circle cx="383" cy="136" r="62" fill="none" stroke="#ffe1a2" stroke-width="7"/><path d="M383 97v42l26 18" fill="none" stroke="#ffe1a2" stroke-width="6"/>',
      '<path d="M309 81h150v132H309z" fill="#b797c7"/><path d="M320 95h128v47H320zm0 59h128v47H320z" fill="#f3debc"/><circle cx="385" cy="119" r="6" fill="#735573"/><circle cx="385" cy="178" r="6" fill="#735573"/>',
      '<path d="m292 143 45-48 45 48v68h-90zm112 0 45-48 45 48v68h-90z" fill="#f4ddc4"/><path d="M322 163h27v48h-27zm112 0h27v48h-27z" fill="#a98fc1"/>',
      '<path d="M294 93h69v99h-69zm92-13h69v112h-69z" fill="#f6e4bd"/><path d="m306 119 42 0m-42 18h42m50-22h42m-42 18h42m-80 83h83" stroke="#a8849d" stroke-width="5"/>',
      '<path d="M294 95h65v92h-65zm82 0h65v92h-65z" fill="#e4edd9"/><circle cx="444" cy="179" r="38" fill="none" stroke="#f5d18e" stroke-width="10"/><path d="m469 208 31 31" stroke="#f5d18e" stroke-width="12" stroke-linecap="round"/>',
      '<path d="M286 104q50-25 100 0 50-25 100 0v97q-50-24-100 0-50-24-100 0z" fill="#ffe8c1"/><path d="M386 104v97m-80-70h54m45 0h54m-153 24h54m45 0h54" stroke="#b38cae" stroke-width="5"/>',
      '<path d="M297 96h91v107h-91zm113 13h65v94h-65z" fill="#ffebc5"/><path d="M310 118h65m-65 20h65m-65 20h65m-65 20h47m55-45h37m-37 22h37m-37 22h37" stroke="#ab82ac" stroke-width="5"/>',
      '<path d="M278 207h228m-220 12h213" stroke="#dfccb1" stroke-width="6"/><rect x="307" y="124" width="110" height="67" rx="16" fill="#d5e8dc"/><path d="M330 123V97h38v26m50 28h32v40h-32" fill="#ffbb88"/><circle cx="333" cy="195" r="15" fill="#f7e2b8"/><circle cx="400" cy="195" r="15" fill="#f7e2b8"/>',
      '<path d="M288 109q100-24 200 0v54q-100 25-200 0z" fill="#b9e1de"/><path d="M385 164v53m0-30h-68v30m68-30h68v30" stroke="#9cd0d0" stroke-width="15" fill="none"/><path d="M299 218h37m30 0h38m30 0h38" stroke="#d2e7ac" stroke-width="15"/>',
      '<path d="M315 186h145m-73-88v110m-63-91h127m-121 0-25 54h51l-26-54m115 0-25 54h51l-26-54" fill="none" stroke="#f9dfae" stroke-width="6" stroke-linejoin="round"/>',
      '<path d="M290 205v-65l34-35 34 35v65zm83 0v-99h44v99zm61 0v-65l34-35 34 35v65z" fill="#f3dbbe"/><path d="M309 155h31m49-24h13m-13 24h13m50 0h31" stroke="#a888bd" stroke-width="8"/>',
      '<path d="M330 218V107l55-48 55 48v111z" fill="#bfa2d7"/><path d="M346 110h78m-78 33h78m-78 33h78" stroke="#f0dcad" stroke-width="5"/><circle cx="385" cy="104" r="12" fill="#ffe3a6"/><path d="M366 218v-26a19 19 0 0 1 38 0v26" fill="#72528c"/>'
    ][id-1];
    return `<section class="scene ${compact?'compact':''}" aria-label="${titles[id-1]}可愛萬聖節裝飾"><svg viewBox="0 0 760 280" role="img" aria-label="${titles[id-1]}：友善幽靈、南瓜、黑貓與${symbols[id-1]}主題裝飾，非歷史影像"><rect width="760" height="280" rx="24" fill="${bg}"/><circle cx="654" cy="58" r="30" fill="${accent}"/><circle cx="667" cy="48" r="27" fill="${bg}"/><g fill="${accent}"><path d="m76 42 4 12 13 3-13 4-4 12-4-12-13-4 13-3zM548 44l3 9 10 3-10 3-3 9-3-9-10-3 10-3zM233 67l3 9 10 3-10 3-3 9-3-9-10-3 10-3z"/><circle cx="163" cy="40" r="3"/><circle cx="594" cy="119" r="3"/></g><ellipse cx="380" cy="251" rx="300" ry="16" fill="#ffffff" opacity=".09"/>${prop}<g transform="translate(111 112) rotate(-7)"><path d="M0 63V27a37 37 0 0 1 74 0v65L60 80 47 92 34 81 20 92 7 81 0 89z" fill="#fff7e9"/><ellipse cx="24" cy="29" rx="4" ry="6" fill="#4b345e"/><ellipse cx="51" cy="29" rx="4" ry="6" fill="#4b345e"/><path d="M30 44q8 9 16 0" stroke="#4b345e" stroke-width="3" fill="none"/><ellipse cx="14" cy="42" rx="7" ry="4" fill="#f8b5bb"/><ellipse cx="61" cy="42" rx="7" ry="4" fill="#f8b5bb"/></g><g transform="translate(554 178)"><path d="M15 13q15-23 41 0 29-9 36 19 4 35-41 32Q4 67 1 38-2 15 15 13z" fill="#ffad65"/><path d="m47 12 4-21 12-4" stroke="#c3d48d" stroke-width="7" fill="none"/><path d="M26 18q-15 25 0 42m25-46v49m24-44q12 25-3 40" stroke="#e68a47" stroke-width="3" fill="none"/><circle cx="33" cy="34" r="4" fill="#5b3b63"/><circle cx="64" cy="34" r="4" fill="#5b3b63"/><path d="M40 44q10 11 20 0" stroke="#5b3b63" stroke-width="3" fill="none"/></g><g transform="translate(658 169)"><path d="m0 19 4-22 18 15 16-15 6 23q18 43-21 48Q-13 63 0 19z" fill="#352844"/><ellipse cx="12" cy="30" rx="4" ry="6" fill="#ffe0a8"/><ellipse cx="33" cy="30" rx="4" ry="6" fill="#ffe0a8"/><path d="m20 41 4 4 4-4" stroke="#efb3c3" stroke-width="3" fill="none"/></g></svg><div class="scene-caption"><strong>${titles[id-1]}</strong><span>遊戲佈景，非歷史場景</span></div></section>`;
  }
  function nav(){
    $('journey').innerHTML=`<div class="journey-head"><div><strong>點亮十二盞記憶燈</strong><span>${totalDone()}／12 關　${(totalDone()*100).toLocaleString('en-US')}／1,200 XP</span><small>12 關自由選擇，隨時跳關，進度會保留。</small></div><div class="journey-actions">${totalDone()===12?'<button id="celebration-open" class="celebration-button">全通關慶祝</button>':''}<button id="library-open" class="secondary">我的收藏 ${owned().length}／15</button></div></div><details id="map" ${mapOpen?'open':''}><summary>自由探索地圖 <span>${celebrating?'十二盞記憶燈，全數點亮':`目前：第 ${data.current} 關 ${esc(level().title.split('：')[0])}`}</span></summary><div class="quest-nav">${LEVELS.map(l=>`<button data-level="${l.id}" class="${l.id===data.current&&!celebrating?'selected':''}" ${l.id===data.current&&!celebrating?'aria-current="page"':''} aria-label="第 ${l.id} 關：${esc(l.title)}，${complete(l.id)?'已完成':'可自由探索'}"><b>${String(l.id).padStart(2,'0')}</b><span>${esc(l.title.split('：')[0])}</span><small>${complete(l.id)?'✓ 已修復':'自由挑戰'}</small></button>`).join('')}</div></details>`;
    $('map').ontoggle=()=>mapOpen=$('map').open;
    document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>go(Number(b.dataset.level)));
    $('library-open').onclick=library;
    if($('celebration-open'))$('celebration-open').onclick=()=>{celebrating=true;render();$('celebration').scrollIntoView({block:'start'});};
  }
  function go(id){if(!allowed(id))return;const previous=data.current;celebrating=false;data.current=id;persist();render();if(previous!==id){const t=$('transition');t.hidden=false;t.textContent=`主題回訪：${LEVELS[previous-1].era} → ${level().era}。關卡順序不等於事件年代順序。`;}window.scrollTo({top:0,behavior:'instant'});}
  function chooseLevel(){mapOpen=true;$('map').open=true;$('journey').scrollIntoView({block:'start'});document.querySelector(`[data-level="${data.current}"]`).focus({preventScroll:true});}
  function sectionLabel(index){return index<4?'前哨：皇民化':index<8?'第一輪：建設與權利':index<12?'第二輪：多元行動':index<16?'第三輪：同化與史實':'終章：時間線與修復';}
  function lessons(){return level().panels.map(([title,text],i)=>`<details class="lesson" ${!state().started&&i===0?'open':''}><summary>${esc(title)}</summary><p>${esc(text)}</p></details>`).join('');}
  function render(){
    const l=level(),s=state(),q=l.questions[s.index],a=s.answers[s.index];
    document.title=`時空守護者｜第 ${l.id} 關・${l.title}｜全選擇題版`;
    nav();
    if(celebrating&&totalDone()===12){
      document.title='全部通關成功！｜時空守護者・南瓜記憶祭';
      $('game').innerHTML=celebration();
      $('celebration-library').onclick=library;
      $('celebration-map').onclick=()=>{celebrating=false;render();chooseLevel();};
      return;
    }
    $('game').innerHTML=`<div id="transition" class="transition" hidden></div><section class="heading"><p class="chapter">第 ${String(l.id).padStart(2,'0')} 關 ／ ${l.questions.length} 道四選一</p><h1>${esc(l.title.split('：')[0])}<span>${esc(l.title.split('：')[1]||'')}</span></h1><p>${esc(l.era)}</p></section><div class="layout"><div class="workspace">${art(l.id,s.started)}${s.complete?result():!s.started?intro():quiz()}<p id="feedback" class="feedback" role="status" aria-live="polite"></p></div><aside><section class="paper progress-panel"><h2>記憶修復進度</h2><p><strong>${passed(s)}</strong>／${l.questions.length} 題已理解</p><progress max="${l.questions.length}" value="${passed(s)}" aria-label="本關答對題數"></progress><p>${s.complete?'本關已獲 100 XP 與徽章。':'答錯可以查提示、重新選擇，不扣分。每題答對並看完解析後，再前往下一題。'}</p>${l.id===12?`<ol class="boss-progress">${['前哨','第一輪','第二輪','第三輪','終章'].map((t,i)=>`<li>${s.answers.slice(i*4,i*4+4).every(r=>r.passed)?'✓':'○'} ${t}</li>`).join('')}</ol>`:''}</section><section class="paper"><h2>小幽靈的教材手冊</h2><p class="citation">${esc(s.started?q.source:l.source)}</p><p class="muted">T1＝6上社1-1.pdf；T2＝6上社1-2.pdf；T3＝6上社1-3.pdf。內容依計畫書摘要，原始 PDF 尚待教師核對。</p>${lessons()}</section><section class="paper"><h2>本關收集目標</h2><p>「${badges[l.id-1]}」徽章</p><p>${l.id<=10?`E${String(l.id).padStart(2,'0')} 教材摘要卡`:l.id===11?'E11 衛生、E12 時間休閒、E13 多元文化':'前哨取得 E14 皇民化；本關完成取得 E15 終章；12 關全破另獲紀念章'}</p><small>教材、查核與合作題皆已改為選擇題，不需輸入理由或等待教師評分。</small></section></aside></div>`;
    bind();
    if(s.started&&!s.complete&&a.attempts.length)showFeedback();
  }
  function intro(){const l=level();return `<section class="task"><div class="npc-note"><span class="ghost-mini" aria-hidden="true">✦</span><div><strong>記憶引導員・阿澄</strong><p>這次用選擇題收集證據，讓記憶燈亮起來。先讀手冊，再選出最有根據的答案。</p><small>阿澄與萬聖節角色都是遊戲設計，對話非歷史人物原話。</small></div></div><h2>本關會學到什麼？</h2><p>${esc(l.goal)}</p><ul class="topic-list">${l.panels.map(([title])=>`<li>${esc(title)}</li>`).join('')}</ul><p class="boundary">${esc(l.boundary)}</p><div class="actions"><button id="start">開始選擇題挑戰</button><button id="read-lesson" class="secondary">先讀本關教材</button><button id="choose-level" class="secondary">選擇其他關卡</button></div></section>`;}
  function quiz(){
    const l=level(),s=state(),q=l.questions[s.index],a=s.answers[s.index];
    return `<section class="task quiz" aria-labelledby="question-title"><div class="question-meta"><span>第 ${s.index+1}／${l.questions.length} 題</span><span>${esc(q.section)}</span></div>${l.id===12?`<p class="boss-label">${sectionLabel(s.index)} · 破解論述，不傷害人物</p>`:''}<form id="answer-form" novalidate><fieldset><legend id="question-title">${esc(q.stem)}</legend><p class="muted">單選題，請選出最符合教材依據的一項。</p><div class="options">${q.choices.map((choice,i)=>`<label class="option ${a.passed&&i===q.answer?'correct':''}"><input type="radio" name="answer" value="${i}" ${s.selected===i?'checked':''} ${a.passed?'disabled':''}><span class="letter" aria-hidden="true">${'ABCD'[i]}</span><span>${esc(choice)}</span>${a.passed&&i===q.answer?'<strong class="correct-mark">✓ 正確</strong>':''}</label>`).join('')}</div></fieldset><div class="actions">${a.passed?`<button type="button" id="next">${s.index===l.questions.length-1?'領取本關成果':l.id===12&&[3,7,11,15].includes(s.index)?'完成本段，前往下一段':'下一題'}</button>`:'<button type="submit" id="submit-answer">核對答案</button>'}<button type="button" id="hint" class="secondary" ${a.hint>=3?'disabled':''}>${a.hint===0?'給我一個提示':a.hint<3?'再看一個提示':'已顯示全部提示'}</button><button type="button" id="choose-level" class="secondary">選擇其他關卡</button></div></form><div id="hint-box">${hintHTML()}</div></section>`;
  }
  function hintHTML(){const s=state(),q=level().questions[s.index],a=s.answers[s.index];return a.hint===0?'':`<div class="hint-box"><strong>小幽靈的提示 ${a.hint}／3</strong><p>先看「${esc(q.section)}」，來源：${esc(q.source)}。</p>${a.hint>=2?`<p>${esc(q.explanation)}</p>`:''}${a.hint>=3?`<p>請找出這個意思：「${esc(q.choices[q.answer])}」。理解後再選一次。</p>`:''}<small>使用提示不扣分。</small></div>`;}
  function showFeedback(){
    const s=state(),q=level().questions[s.index],a=s.answers[s.index],last=a.attempts.at(-1);
    if(!last)return;
    $('feedback').className='feedback '+(a.passed?'right':'retry');
    $('feedback').innerHTML=`<strong>${a.passed?'✓ 記憶燈亮了！':'再查核一次，就能更接近答案。'}</strong><p>${a.passed?'你已選出有根據的答案。':`剛才選擇「${esc(q.choices[last.choice])}」。請讀解析後重新選擇。`}</p><p><strong>解析：</strong>${esc(q.explanation)}</p><p class="citation">來源：${esc(q.source)}</p>${data.current===12&&prelude()&&s.index===3&&a.passed?'<p>已取得 E14 皇民化卡，現在可進入三輪選擇題論證。</p>':''}`;
  }
  function result(){
    const l=level(),next=nextIncomplete();
    return `<section class="task result"><div class="award-icon" aria-hidden="true">✦</div><p class="section-label">本關記憶修復完成</p><h2>你點亮了「${badges[l.id-1]}」記憶燈！</h2><p>${l.questions.length} 題全數理解，獲得 <strong>100 XP</strong>。</p><p class="muted">通關 60 ＋ 來源選擇題 20 ＋ 查核修正題 10 ＋ 合作反思題 10。答錯、查提示與重看不扣分，各關只發一次。</p>${l.id===12?'<div class="ending"><strong>1945 年日本戰敗，臺灣結束日本統治。</strong><p>你完成的是證據判讀與歷史理解，遊戲通關不是日本戰敗的原因。</p></div>':''}<p>已修復 ${totalDone()}／12 關，收集 ${owned().length}／15 張摘要卡。${next?'還有記憶燈等你探索，可以自由選擇下一站。':'十二盞記憶燈已全數點亮！'}</p><div class="actions">${next?`<button id="next-level">繼續探索：第 ${next} 關</button>`:'<button id="result-celebration">觀看全通關慶祝</button>'}<button id="choose-level" class="secondary">選擇其他關卡</button><button id="review-level" class="secondary">重看本關題目與解析</button></div></section>`;
  }
  function celebration(){
    const ghosts=[[155,90,-8],[590,80,10],[725,135,-7]].map(([x,y,turn],i)=>`<g class="party-ghost" transform="translate(${x} ${y}) rotate(${turn})"><path d="M0 66V27a37 37 0 0 1 74 0v65L60 80 47 92 34 81 20 92 7 81 0 89z" fill="#fff8eb"/><ellipse cx="24" cy="29" rx="4" ry="6" fill="#4b345e"/><ellipse cx="51" cy="29" rx="4" ry="6" fill="#4b345e"/><path d="M30 44q8 12 16 0" stroke="#4b345e" stroke-width="3" fill="none"/><ellipse cx="14" cy="42" rx="7" ry="4" fill="#f8b5bb"/><ellipse cx="61" cy="42" rx="7" ry="4" fill="#f8b5bb"/>${i===0?'<path d="m6-2 32-36 32 36z" fill="#ffbc77"/><circle cx="38" cy="-38" r="6" fill="#ffe3a7"/>':'<path d="m25-9 12 7 12-7v16L37 0 25 7z" fill="#c7e7d9"/>'}</g>`).join('');
    return `<section id="celebration" class="celebration" aria-labelledby="celebration-title"><div class="celebration-sparkles" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i style="left:${(i*37)%97}%;top:${(i*23)%89}%;--turn:${i*29}deg;--delay:${(i%5)*80}ms"></i>`).join('')}</div><p class="celebration-eyebrow">南瓜記憶祭 · 十二盞燈全亮了</p><h1 id="celebration-title" tabindex="-1">全部通關成功！</h1><p class="celebration-intro">你用證據點亮歷史，成為真正的時空守護者。</p><div class="celebration-art"><svg viewBox="0 0 900 300" role="img" aria-label="戴派對帽的友善小幽靈、微笑南瓜與黑貓，在星光下慶祝十二關全部完成"><rect width="900" height="300" rx="30" fill="#594077"/><path d="M40 30q400 100 820 0" fill="none" stroke="#f2d5a3" stroke-width="3"/>${[85,190,295,400,505,610,715,820].map((x,i)=>`<path d="m${x} ${45+(i>3?7-i: i)*8} 17 32 17-30z" fill="${i%2?'#c9e9dc':'#ffc383'}"/>`).join('')}<circle cx="815" cy="65" r="27" fill="#ffe1a2"/><circle cx="827" cy="54" r="24" fill="#594077"/><g fill="#ffe0a0"><path d="m90 123 4 12 13 4-13 4-4 12-4-12-13-4 13-4zM508 111l4 12 13 4-13 4-4 12-4-12-13-4 13-4zM301 183l4 12 13 4-13 4-4 12-4-12-13-4 13-4z"/><circle cx="269" cy="113" r="3"/><circle cx="680" cy="111" r="3"/></g><ellipse cx="450" cy="270" rx="365" ry="14" fill="#ffffff12"/>${ghosts}<g transform="translate(342 148)"><path d="M23 19q25-33 64-5 44-19 64 8 28-7 37 32 9 58-78 62Q5 120 0 70-6 30 23 19z" fill="#ffad65"/><path d="m95 16 6-36 22-6" stroke="#bed890" stroke-width="11" fill="none"/><path d="M45 24q-24 45 0 82m51-90v95m45-86q21 44-2 81" stroke="#df8845" stroke-width="4" fill="none"/><ellipse cx="66" cy="57" rx="6" ry="8" fill="#513661"/><ellipse cx="126" cy="57" rx="6" ry="8" fill="#513661"/><path d="M79 78q18 20 36 0" stroke="#513661" stroke-width="5" fill="none"/><ellipse cx="45" cy="77" rx="12" ry="6" fill="#f29086"/><ellipse cx="147" cy="77" rx="12" ry="6" fill="#f29086"/></g><g transform="translate(265 225)"><path d="m0 3 4-20 17 15 16-15 5 20q16 35-21 38Q-12 37 0 3z" fill="#30213f"/><ellipse cx="12" cy="13" rx="3" ry="5" fill="#ffe0a8"/><ellipse cx="30" cy="13" rx="3" ry="5" fill="#ffe0a8"/><path d="m18 24 4 4 4-4" stroke="#efb3c3" stroke-width="3" fill="none"/></g></svg></div><div class="celebration-stats"><div><strong>12／12</strong><span>關卡全部修復</span></div><div><strong>${LEVELS.reduce((n,l)=>n+l.questions.length,0)}</strong><span>選擇題全數完成</span></div><div><strong>${owned().length} 張</strong><span>教材摘要卡</span></div><div><strong>1,200 XP</strong><span>探索成果</span></div></div><div class="grand-award"><div class="grand-medal"><span aria-hidden="true">✦</span><strong>全程修復</strong><small>B13 紀念章</small></div><div><h2>謝謝你，歷史記憶守護者！</h2><p>無論從哪一關開始，你都完成了全部挑戰。阿澄、小幽靈與南瓜朋友，一起為你的查核、思考與修正喝采。</p><p class="muted">歷史事件有既定結果；你完成的是理解與證據判讀，萬聖節慶典為遊戲設計。</p></div></div><div class="celebration-badges" aria-label="十二枚關卡徽章">${badges.map((b,i)=>`<span><small>${String(i+1).padStart(2,'0')}</small>${b}</span>`).join('')}</div><div class="actions celebration-actions"><button id="celebration-library">查看全部卡片與徽章</button><button id="celebration-map" class="secondary">回到關卡地圖</button></div><p class="muted">成果已保留；隨時可從上方「全通關慶祝」再次欣賞。</p></section>`;
  }
  function bind(){
    const l=level(),s=state();
    if($('start'))$('start').onclick=()=>{s.started=true;persist();render();$('question-title').scrollIntoView({block:'center'});};
    if($('read-lesson'))$('read-lesson').onclick=()=>{document.querySelectorAll('.lesson').forEach(d=>d.open=true);document.querySelector('.lesson').scrollIntoView({block:'start'});};
    document.querySelectorAll('input[name="answer"]').forEach(input=>input.onchange=()=>{s.selected=Number(input.value);persist();});
    if($('answer-form'))$('answer-form').onsubmit=e=>{
      e.preventDefault();const q=l.questions[s.index],a=s.answers[s.index];
      if(a.passed||s.complete)return;
      const input=document.querySelector('input[name="answer"]:checked');
      if(!input){$('feedback').textContent='先選一個答案，再核對。沒有選擇不會記作答錯。';$('feedback').scrollIntoView({block:'nearest'});return;}
      const choice=Number(input.value);s.selected=choice;
      const ok=choice===q.answer;
      a.attempts.push({choice,correct:ok,time:new Date().toISOString()});a.passed=ok;
      persist();render();$('feedback').scrollIntoView({block:'nearest'});
      if(ok)$('next').focus({preventScroll:true});
    };
    if($('hint'))$('hint').onclick=()=>{const a=s.answers[s.index];a.hint=Math.min(3,a.hint+1);persist();$('hint-box').innerHTML=hintHTML();$('hint').textContent=a.hint<3?'再看一個提示':'已顯示全部提示';$('hint').disabled=a.hint>=3;};
    if($('next'))$('next').onclick=()=>{
      if(!s.answers[s.index].passed)return;
      if(s.index===l.questions.length-1){if(!s.answers.every(a=>a.passed))return;s.complete=true;if(totalDone()===12)celebrating=true;}
      else{s.index++;s.selected=null;}
      persist();render();const target=celebrating?$('celebration'):s.complete?document.querySelector('.result'):$('question-title');target.scrollIntoView({block:'start'});if(celebrating)$('celebration-title').focus({preventScroll:true});
    };
    if($('next-level'))$('next-level').onclick=()=>go(nextIncomplete());
    if($('choose-level'))$('choose-level').onclick=chooseLevel;
    if($('result-celebration'))$('result-celebration').onclick=()=>{celebrating=true;render();$('celebration').scrollIntoView({block:'start'});};
    if($('review-level'))$('review-level').onclick=()=>teacher(l.id);
    
  }
  function modal(title,body){$('modal').innerHTML=`<div class="modal-head"><h2 id="modal-title">${esc(title)}</h2><button id="modal-close" class="quiet">關閉</button></div>${body}`;$('modal-close').onclick=()=>$('modal').close();if(!$('modal').open)$('modal').showModal();$('modal').scrollTop=0;}
  function library(){
    const rows=[[1,'1895 年','割臺、臺灣民主國成立與失敗'],[4,'1915 年','噍吧哖事件'],[7,'1920 年代','非武裝爭權與文化啟蒙'],[10,'1925 年','二林蔗農事件'],[5,'1930 年','霧社事件'],[9,'1930 年','嘉南大圳完工'],[12,'1937 年','皇民化推動'],[12,'1945 年','日本戰敗、結束日本統治']];
    modal('南瓜記憶手冊',`<p>已收集 ${owned().length}／15 張教材摘要卡，${totalDone()}／12 枚關卡徽章${totalDone()===12?'，另獲 B13 全程修復紀念章':''}。</p><h3>年代時間線</h3><p>探索順序依主題安排；未指明始年的制度，不擅補年份。</p><ol class="timeline">${rows.map(([id,year,text])=>`<li><strong>${year}</strong><span>${complete(id)||(id===12&&year==='1937 年'&&prelude())?esc(text)+'（已核對）':'待修復'}</span><small>${esc(LEVELS[id-1].source)}</small></li>`).join('')}</ol><h3>記憶徽章</h3><div class="badges">${badges.map((b,i)=>complete(i+1)?`<span class="badge">${b}<small>B${String(i+1).padStart(2,'0')}</small></span>`:'').join('')}${totalDone()===12?'<span class="badge special">全程修復<small>B13</small></span>':''}</div><h3>教材摘要卡</h3><div class="card-grid">${owned().map(cardHTML).join('')||'<p>完成任一關，開始收集。</p>'}</div>`);
  }
  function teacher(id=data.current){
    const l=LEVELS[id-1],s=data.levels[id];
    const attempts=s?s.answers.reduce((n,a)=>n+a.attempts.length,0):0;
    const correctFirst=s?s.answers.filter(a=>a.attempts[0]?.correct).length:0;
    modal('教學紀錄與選擇題題庫',`<p>此頁可查閱十二關教材、答案與本機作答紀錄，不需教師核准即可通關。題庫為教學用途，沒有帳號或身分驗證。</p><label class="field" for="teacher-level">選擇關卡</label><select id="teacher-level">${LEVELS.map(l=>`<option value="${l.id}" ${l.id===id?'selected':''}>第 ${l.id} 關：${esc(l.title)}</option>`).join('')}</select><h3>${esc(l.title)}</h3><p>${l.questions.length} 題，已答對 ${s?passed(s):0} 題；首次答對 ${correctFirst} 題；共 ${attempts} 次有效作答。首次答對數只供教學觀察，不扣學習獎勵。</p><div class="lesson-review">${l.panels.map(([t,p])=>`<h3>${esc(t)}</h3><p>${esc(p)}</p>`).join('')}</div>${l.questions.map((q,i)=>`<details class="question-review"><summary>${i+1}．${esc(q.section)} · ${esc(q.stem)}</summary><ol type="A">${q.choices.map((c,j)=>`<li ${j===q.answer?'class="key-answer"':''}>${esc(c)}${j===q.answer?'（正確）':''}</li>`).join('')}</ol><p><strong>解析：</strong>${esc(q.explanation)}</p><p class="citation">${esc(q.source)}</p><h4>本機作答紀錄</h4>${s?.answers[i].attempts.length?`<ol>${s.answers[i].attempts.map(a=>`<li>${esc(new Date(a.time).toLocaleString('zh-TW'))} · 選 ${'ABCD'[a.choice]} · ${a.correct?'答對':'待修正'}</li>`).join('')}</ol>`:'<p class="muted">尚無有效作答。</p>'}</details>`).join('')}`);
    $('teacher-level').onchange=()=>teacher(Number($('teacher-level').value));
  }
  $('teacher-open').onclick=()=>teacher();
  $('reset').onclick=()=>{
    modal('重新開始選擇題版？','<p>將清除新版十二關的選擇題進度、答題紀錄、卡片與獎勵，無法復原。先前操作題版的存檔不會刪除。</p><div class="actions"><button id="reset-cancel" class="secondary">保留進度</button><button id="reset-confirm">清除新版並重新開始</button></div>');
    $('reset-cancel').onclick=()=>$('modal').close();
    $('reset-confirm').onclick=()=>{try{localStorage.removeItem(KEY);data=fresh();celebrating=false;mapOpen=true;warning='';$('save-warning').hidden=true;$('modal').close();persist();render();window.scrollTo({top:0});}catch{$('modal').close();warning='瀏覽器拒絕清除進度，原存檔仍保留。';persist();}};
  };
  if(!allowed(data.current))data.current=1;
  celebrating=totalDone()===12;
  render();
  if(warning){$('save-warning').textContent=warning;$('save-warning').hidden=false;$('save-status').textContent='存檔需要注意';}
  else{
    $('save-status').textContent='全選擇題進度已就緒';
    try{if(!localStorage.getItem(KEY)&&(localStorage.getItem('time-guardian-q01-v1')||localStorage.getItem('time-guardian-campaign-v1'))){$('save-warning').hidden=false;$('save-warning').textContent='舊版進度已保留。新版使用獨立存檔，請重新完成選擇題挑戰。';}}catch{}
  }
})();
