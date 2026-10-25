/* ===== 食养本草 · 交互逻辑 ===== */
(function(){
  "use strict";
  var FOODS = window.FOODS || [];
  var byId = {}, byName = {};
  FOODS.forEach(function(f){ byId[f.id]=f; byName[f.name]=f; });

  /* ---------- 统计 ---------- */
  function countTendency(){
    var y=0,p=0,h=0;
    FOODS.forEach(function(f){
      if(f.tendency==="偏阴") y++; else if(f.tendency==="平性") p++; else h++;
    });
    setText("cntYin",y); setText("cntPing",p); setText("cntHuo",h);
  }
  function setText(id,v){var e=document.getElementById(id); if(e) e.textContent=v;}

  /* ---------- 性味工具 ---------- */
  function natureClass(n){ return {"寒":"寒","凉":"凉","微寒":"微寒","平":"平","微温":"微温","温":"温","热":"热"}[n]||"平"; }
  function tendencyDot(t){ return t==="偏阴"?"yin":(t==="偏火"?"huo":"ping"); }

  /* ---------- 下拉填充 ---------- */
  function fillSelects(){
    var sorted = FOODS.slice().sort(function(a,b){return a.name.localeCompare(b.name,"zh")});
    ["cmpA","cmpB"].forEach(function(sid){
      var sel=document.getElementById(sid); if(!sel) return;
      sel.innerHTML='<option value="">— 选择食材 —</option>';
      sorted.forEach(function(f){
        var o=document.createElement("option");
        o.value=f.id; o.textContent=f.name+"（"+f.tendency+"）";
        sel.appendChild(o);
      });
    });
  }

  /* ---------- 真实图片（来自 foods_images.js 的 Pexels 照片） ---------- */
  var FOOD_IMG = window.FOOD_IMG || {};
  function imgFor(f){ return FOOD_IMG[f.id]||""; }

  /* ---------- 食物 emoji 映射（仅作图片加载失败时的兜底） ---------- */
  var EMOJI={
    gouqi:"🔴",shanyao:"🥔",baihe:"🌷",yiyiren:"🌾",lianzi:"🪷",dazao:"🔴",guiyuan:"🟤",shanzha:"🍒",juemingzi:"🟫",juhua:"🌼",jinyinhua:"🌸",bohe:"🌿",huoxiang:"🌿",fuling:"🟤",ejiao:"🟫",fengmi:"🍯",rougui:"🟤",dingxiang:"🌰",bajiao:"⭐",huajiao:"🌶️",hujiao:"⚪",xiaohuixiang:"🌱",chenpi:"🍊",sharen:"🌿",biandou:"🟢",gancao:"🌿",sangshen:"🟣",heizhima:"⚫",hetao:"🌰",suanzaoren:"🟤",xingren:"🌰",mugua:"🍈",qianshi:"🟢",huangjing:"🟡",yuzhu:"🟢",luohanguo:"🟤",taoren:"🍑",maiya:"🌾",
    baicai:"🥬",bocai:"🥬",qincai:"🥬",jiucai:"🥬",luobo:"🥕",huluobo:"🥕",donggua:"🥒",huanggua:"🥒",kugua:"🥒",sigua:"🥒",nangua:"🎃",qiezi:"🍆",fanqie:"🍅",tudou:"🥔",lianou:"🪷",zhusun:"🎋",muer:"🍄",xianggu:"🍄",huanghuacai:"🌼",xiancai:"🥬",kongxincai:"🥬",shengcai:"🥬",woju:"🥬",yangcong:"🧅",dasuan:"🧄",shengjiang:"🫚",lajiao:"🌶️",yanxu:"🌿",xilanqie:"🥦",
    pingguo:"🍎",li:"🍐",tao:"🍑",lizi:"🍐",xigua:"🍉",tianjie:"🍈",putao:"🍇",shiliu:"🍎",ganju:"🍊",chengzi:"🍊",youzi:"🍊",ningmeng:"🍋",xiangjiao:"🍌",boluo:"🍍",lizhi:"🍒",mangguo:"🥭",mihoutao:"🥝",caomei:"🍓",yingtao:"🍒",shizi:"🍅",xing:"🍑",pipa:"🍑",yangmei:"🍒",yezi:"🥥",
    jiyu:"🐟",liyu:"🐟",caoyu:"🐟",lianyu:"🐟",heiyu:"🐟",shanyu:"🐍",daidaiyu:"🐟",huanghuayu:"🐟",xia:"🦐",pangxie:"🦀",geli:"🐚",haidai:"🌊",zicai:"🌊",haishen:"🐠",muli:"🦪",youyu:"🦑",niguiyu:"🐟",
    zhurou:"🥩",niurou:"🥩",yangrou:"🥩",jirou:"🍗",yarou:"🦆",erou:"🦢",lurou:"🥩",turou:"🐰",
    jingmi:"🍚",nuomi:"🍚",xiaomi:"🌾",xiaomai:"🌾",yumi:"🌽",huangdou:"🫘",lvdou:"🟢",hongdou:"🔴",heidou:"⚫",doufu:"🧈",chixiaodou:"🫘",
    jidan:"🥚",yadan:"🥚",niunai:"🥛",cu:"🍶",hongtang:"🟤",ye:"🍵",jiu:"🍶"
  };
  function emojiFor(f){ return EMOJI[f.id]||({药食同源:"🌿",蔬菜:"🥬",水果:"🍎",水产:"🐟",肉类:"🥩",谷物豆类:"🌾",蛋奶调料:"🥚"}[f.category]||"🍽️"); }

  /* ---------- 食材卡片网格（分页，每页12，紧凑） ---------- */
  var curCat="全部", shownCount=0, PAGE_SIZE=12, curList=[];
  function renderGrid(cat,reset){
    curCat=cat||"全部";
    if(reset!==false){ shownCount=0; }
    var grid=document.getElementById("foodGrid"); if(!grid) return;
    curList = curCat==="全部"?FOODS:FOODS.filter(function(f){return f.category===curCat;});
    if(shownCount===0) grid.innerHTML="";
    var end=Math.min(shownCount+PAGE_SIZE, curList.length);
    for(var i=shownCount;i<end;i++){
      var f=curList[i];
      var c=document.createElement("div");
      c.className="food-card";
      var url = imgFor(f);
      c.innerHTML =
        '<div class="fc-thumb" data-emoji="'+emojiFor(f)+'">'+(url?'<img src="'+url+'" alt="'+f.name+'" loading="lazy" onerror="this.style.display=\'none\'">':'')+'</div>'+
        '<div class="fc-body">'+
          '<span class="fc-cat">'+f.category+'</span>'+
          '<h3>'+f.name+'</h3>'+
          '<div class="fc-nat"><span class="tendency-dot '+tendencyDot(f.tendency)+'"></span>'+f.tendency+' · '+natureLabel(f.nature)+'</div>'+
          '<div class="fc-link">查看详情 ›</div>'+
        '</div>';
      c.onclick=(function(id){return function(){showDetail(id);};})(f.id);
      grid.appendChild(c);
    }
    shownCount=end;
    var btn=document.getElementById("loadMoreBtn");
    var cnt=document.getElementById("gridCount");
    if(cnt) cnt.textContent='已显示 '+shownCount+' / '+curList.length+' 种';
    if(btn){ btn.style.display = shownCount>=curList.length?"none":"inline-block"; }
  }
  function natureLabel(n){ return {"寒":"寒凉","凉":"寒凉","微寒":"寒凉","平":"温和","微温":"温和","温":"温热","热":"温热"}[n]||"温和"; }
  function initLoadMore(){
    var btn=document.getElementById("loadMoreBtn");
    if(!btn) return;
    btn.onclick=function(){ renderGrid(curCat,false); };
  }

  /* ---------- 搜索 ---------- */
  function initSearch(){
    var input=document.getElementById("searchInput");
    var btn=document.getElementById("searchBtn");
    var sug=document.getElementById("searchSuggest");
    if(!input||!btn) return;
    function doSearch(){
      var q=input.value.trim();
      if(!q){ showSuggest([]); return; }
      var hits=FOODS.filter(function(f){
        return f.name.indexOf(q)>=0 || f.alias.indexOf(q)>=0 || f.id.indexOf(q.toLowerCase())>=0
          || f.category.indexOf(q)>=0 || f.efficacy.indexOf(q)>=0;
      });
      if(hits.length===1){ showDetail(hits[0].id); input.value=""; hideSuggest(); }
      else if(hits.length===0){ showSuggestEmpty(q); }
      else { showSuggest(hits); }
    }
    btn.onclick=doSearch;
    input.addEventListener("input",function(){
      var q=input.value.trim();
      if(!q){ hideSuggest(); return; }
      var hits=FOODS.filter(function(f){return f.name.indexOf(q)>=0||f.alias.indexOf(q)>=0;}).slice(0,8);
      showSuggest(hits,q);
    });
    input.addEventListener("keydown",function(e){ if(e.key==="Enter") doSearch(); });
    document.addEventListener("click",function(e){
      if(!e.target.closest(".search-box")&&!e.target.closest(".search-suggest")) hideSuggest();
    });
    function showSuggest(hits,q){
      if(!hits.length){ showSuggestEmpty(q); return; }
      sug.innerHTML="";
      hits.forEach(function(f){
        var it=document.createElement("div");
        it.className="s-item";
        it.innerHTML='<span>'+f.name+' <small style="color:#888">'+f.efficacy.slice(0,14)+'</small></span><span class="s-cat">'+f.category+'</span>';
        it.onclick=function(){ showDetail(f.id); input.value=f.name; hideSuggest(); };
        sug.appendChild(it);
      });
      sug.classList.add("show");
    }
    function showSuggestEmpty(q){
      sug.innerHTML='<div class="empty">未找到“'+q+'”，试试：枸杞、山药、螃蟹、西瓜</div>';
      sug.classList.add("show");
    }
    function hideSuggest(){ sug.classList.remove("show"); sug.innerHTML=""; }
  }

  /* ---------- 详情弹窗 ---------- */
  function showDetail(id){
    var f=byId[id]; if(!f) return;
    var body=document.getElementById("detailBody");
    if(!body) return;
    var n=f.nutrition;
    var url = imgFor(f);
    body.innerHTML =
      '<div class="detail-body">'+
        '<div class="d-hero" data-emoji="'+emojiFor(f)+'">'+(url?'<img src="'+url+'" alt="'+f.name+'" onerror="this.style.display=\'none\'">':'')+
          '<div class="d-hero-cap"><span class="d-cat">'+f.category+'</span><h2>'+f.name+'</h2><span class="d-alias">别名：'+f.alias+'</span></div>'+
        '</div>'+
        '<div class="d-nat"><span class="tendency-dot '+tendencyDot(f.tendency)+'"></span>'+f.tendency+' · 性'+f.nature+' · 味'+f.flavor+' · '+f.meridian+'</div>'+
        '<div class="d-grid">'+
          '<div class="d-item"><div class="k">主要功效</div><div class="v">'+f.efficacy+'</div></div>'+
          '<div class="d-item"><div class="k">适宜季节</div><div class="v">'+f.season+'</div></div>'+
          '<div class="d-item"><div class="k">热量(每100g)</div><div class="v">'+n.kcal+' kcal</div></div>'+
          '<div class="d-item"><div class="k">蛋白质 / 脂肪</div><div class="v">'+n.protein+'g / '+n.fat+'g</div></div>'+
          '<div class="d-item"><div class="k">碳水 / 膳食纤维</div><div class="v">'+n.carbs+'g / '+n.fiber+'g</div></div>'+
          '<div class="d-item"><div class="k">偏阴/偏火</div><div class="v">'+f.tendency+'</div></div>'+
        '</div>'+
        '<div class="d-section"><h4><span class="bar"></span>食材简介</h4><p style="font-size:14px;color:#3f5a4d">'+f.description+'</p></div>'+
        pairBlock("✓ 宜搭配", f.match, "")+
        pairBlock("✗ 不宜搭配", f.clash, "clash")+
        '<div class="d-section"><h4><span class="bar"></span>优点</h4><ul class="d-pros">'+liList(f.pros)+'</ul></div>'+
        '<div class="d-section"><h4><span class="bar"></span>注意事项</h4><ul class="d-cons">'+liList(f.cons)+'</ul></div>'+
        '<div class="d-taboo"><b>禁忌人群：</b>'+f.taboos+'</div>'+
        '<div class="d-footer-cta">本内容仅供科普参考，不能替代专业医疗建议</div>'+
      '</div>';
    openModal();
  }
  function pairBlock(title,list,cls){
    if(!list||!list.length) return "";
    var lis=list.map(function(p){return '<li><b>'+p.food+'</b>　'+p.reason+'</li>';}).join("");
    return '<div class="d-section"><h4><span class="bar"></span>'+title+'</h4><ul class="pair-list '+cls+'">'+lis+'</ul></div>';
  }
  function liList(arr){ return arr.map(function(x){return '<li>'+x+'</li>';}).join(""); }

  function openModal(){ var m=document.getElementById("detailModal"); if(m){m.classList.add("show"); m.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden";} }
  function closeModal(){ var m=document.getElementById("detailModal"); if(m){m.classList.remove("show"); m.setAttribute("aria-hidden","true"); document.body.style.overflow="";} }

  /* ---------- 双选对比 ---------- */
  function initCompare(){
    var btn=document.getElementById("cmpBtn");
    if(!btn) return;
    btn.onclick=function(){
      var a=document.getElementById("cmpA").value;
      var b=document.getElementById("cmpB").value;
      var box=document.getElementById("cmpResult");
      if(!a||!b){ box.innerHTML='<div class="cmp-empty">请选择两种食材再进行对比</div>'; return; }
      if(a===b){ box.innerHTML='<div class="cmp-empty">请选择两种不同的食材</div>'; return; }
      renderCompare(byId[a],byId[b]);
    };
  }
  function renderCompare(f1,f2){
    var n1=f1.nutrition,n2=f2.nutrition;
    var box=document.getElementById("cmpResult");
    var rows=[
      {label:"分类", v1:f1.category, v2:f2.category},
      {label:"性(寒热)", v1:'<span class="nature-tag '+natureClass(f1.nature)+'">性'+f1.nature+'</span>', v2:'<span class="nature-tag '+natureClass(f2.nature)+'">性'+f2.nature+'</span>'},
      {label:"偏阴/偏火", v1:'<span class="tendency-dot '+tendencyDot(f1.tendency)+'"></span>'+f1.tendency, v2:'<span class="tendency-dot '+tendencyDot(f2.tendency)+'"></span>'+f2.tendency},
      {label:"五味", v1:f1.flavor, v2:f2.flavor},
      {label:"归经", v1:f1.meridian, v2:f2.meridian},
      {label:"热量(kcal)", v1:cmpVal(n1.kcal,n2.kcal), v2:cmpVal(n2.kcal,n1.kcal)},
      {label:"蛋白质(g)", v1:cmpVal(n1.protein,n2.protein), v2:cmpVal(n2.protein,n1.protein)},
      {label:"脂肪(g)", v1:cmpVal(n1.fat,n2.fat), v2:cmpVal(n2.fat,n1.fat)},
      {label:"碳水(g)", v1:cmpVal(n1.carbs,n2.carbs), v2:cmpVal(n2.carbs,n1.carbs)},
      {label:"膳食纤维(g)", v1:cmpVal(n1.fiber,n2.fiber), v2:cmpVal(n2.fiber,n1.fiber)},
      {label:"主要功效", v1:f1.efficacy, v2:f2.efficacy},
      {label:"适宜季节", v1:f1.season, v2:f2.season}
    ];
    var html='<div class="cmp-table">'+
      '<div class="head label">对比项</div><div class="head name">'+f1.name+'</div><div class="head name">'+f2.name+'</div>';
    rows.forEach(function(r){
      html+='<div class="label">'+r.label+'</div><div class="val">'+r.v1+'</div><div class="val">'+r.v2+'</div>';
    });
    html+='</div>';
    html+='<div class="cmp-proscons">'+
      '<div class="pc-card"><h4>'+f1.name+' · 优缺点</h4>'+
        '<div class="pc-card pros"><ul>'+liList(f1.pros)+'</ul></div>'+
        '<div class="pc-card cons" style="border-top-color:var(--huo);margin-top:12px"><ul>'+liList(f1.cons)+'</ul></div>'+
      '</div>'+
      '<div class="pc-card b"><h4>'+f2.name+' · 优缺点</h4>'+
        '<div class="pc-card pros"><ul>'+liList(f2.pros)+'</ul></div>'+
        '<div class="pc-card cons" style="border-top-color:var(--huo);margin-top:12px"><ul>'+liList(f2.cons)+'</ul></div>'+
      '</div>'+
    '</div>';
    // 对比结论
    html+='<div class="d-taboo" style="margin-top:16px"><b>对比小结：</b>'+compareSummary(f1,f2)+'</div>';
    box.innerHTML=html;
  }
  function cmpVal(a,b){ a=Number(a)||0; b=Number(b)||0; var s=a>b?'<span style="color:var(--green-deep);font-weight:800">'+a+'</span> ↑':(a<b?'<span style="color:var(--huo)">'+a+'</span> ↓':'<b>'+a+'</b> ='); return s; }
  function compareSummary(f1,f2){
    var order={"寒":1,"凉":2,"微寒":2,"平":3,"微温":4,"温":5,"热":6};
    var s1=order[f1.nature]||3, s2=order[f2.nature]||3;
    var rel = s1<s2 ? (f1.name+"偏寒凉、"+f2.name+"偏温热，寒热互补，阳虚畏寒者宜多食"+f2.name+"，阴虚火旺者宜多食"+f1.name+"。")
                    : (s1>s2 ? (f1.name+"偏温热、"+f2.name+"偏寒凉，寒热互补，体寒者宜"+f1.name+"，上火者宜"+f2.name+"。")
                             : (f1.name+"与"+f2.name+"寒热相近（均"+natureLabel(f1.nature)+"），搭配时注意勿过偏，可佐以平性食材调和。"));
    return rel;
  }

  /* ---------- 知识文章（emoji 配色块，永远可显示） ---------- */
  var PLANT_ARTICLES=[
    {img:"gouqi",emoji:"🔴",title:"枸杞：从荒漠野果到养生圣品的千年传奇",desc:"枸杞是茄科枸杞属植物的成熟果实，原产于中国西北干旱地区，早在《神农本草经》中便被列为上品，是名副其实的“东方神草”。"},
    {img:"shanyao",emoji:"🥔",title:"山药：藏在泥土里的“健脾第一药”",desc:"山药是薯蓣科薯蓣属植物的块茎，既是餐桌上的美味，也是中医常用的健脾补肾良药，被誉为“神仙之食”。"},
    {img:"baihe",emoji:"🌷",title:"百合：一朵花里的润肺清心之道",desc:"百合既是观赏名花，又是药食两用的佳品。其地下鳞茎洁白如玉，是中医常用的润肺安神良药。"},
    {img:"shengjiang",emoji:"🫚",title:"生姜：厨房里的“呕家圣药”",desc:"生姜为姜科根茎，辛温散寒、温中止呕，被称为“呕家圣药”，亦是日常驱寒暖胃的调味要品。"}
  ];
  var PAIR_ARTICLES=[
    {img:"xigua",emoji:"🍉",title:"寒热平衡：中医食疗的核心智慧",desc:"中医认为食物有寒、凉、平、温、热之分，合理搭配寒热属性，是食疗养生的根本原则。"},
    {img:"xiezi",emoji:"🍆",title:"食物相克真相：科学看待传统搭配禁忌",desc:"民间流传着许多“食物相克”的说法，哪些有科学依据？哪些只是误解？本文为你理性辨析。"},
    {img:"chengzi",emoji:"🍊",title:"四季饮食调理：顺应天时的养生之道",desc:"中医讲究“天人合一”，饮食应顺应四时变化，春养肝、夏养心、秋养肺、冬养肾。"},
    {img:"ye",emoji:"🍵",title:"药食同源：吃对食物就是最好的药",desc:"“药食同源”是中医独特智慧，许多日常食物本身即是良药，了解属性，吃出健康。"}
  ];
  function renderArticles(listId,articles){
    var box=document.getElementById(listId); if(!box) return;
    box.innerHTML="";
    articles.forEach(function(a){
      var imgId = a.img ? (FOOD_IMG[a.img]||"") : "";
      var c=document.createElement("div");
      c.className="article-card";
      c.innerHTML='<div class="ac-img" data-emoji="'+(a.emoji||'🌿')+'">'+(imgId?'<img src="'+imgId+'" alt="" onerror="this.style.display=\'none\'">':'')+'</div>'+
        '<div class="ac-body"><h3>'+a.title+'</h3><p>'+a.desc+'</p></div>';
      box.appendChild(c);
    });
  }

  /* ---------- 筛选 tabs ---------- */
  function initTabs(){
    var tabs=document.querySelectorAll("#filterTabs .tab");
    tabs.forEach(function(t){
      t.onclick=function(){
        tabs.forEach(function(x){x.classList.remove("active");});
        t.classList.add("active");
        renderGrid(t.getAttribute("data-cat"));
      };
    });
  }

  /* ---------- 弹窗关闭 ---------- */
  function initModalClose(){
    var m=document.getElementById("detailModal");
    if(!m) return;
    m.addEventListener("click",function(e){
      if(e.target.hasAttribute("data-close")) closeModal();
    });
    document.addEventListener("keydown",function(e){ if(e.key==="Escape") closeModal(); });
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded",function(){
    countTendency();
    fillSelects();
    renderGrid("全部");
    initSearch();
    initCompare();
    initTabs();
    initLoadMore();
    initModalClose();
    renderArticles("plantList",PLANT_ARTICLES);
    renderArticles("pairingList",PAIR_ARTICLES);
  });
})();
