/* =============================================================
 * 智能配菜 · 交互引擎
 * 拖拽画布 / 三色搭配相容性校验 / 菜品匹配 / 辅料计算 / 营养分析
 * ============================================================= */
(function(){
  "use strict";
  var FOODS = window.FOODS || [];
  var IMG = window.FOOD_IMG || {};
  var RULES = window.PEICAI_RULES || [];
  var DISHES = window.PEICAI_DISHES || [];
  var FREEFORM = window.PEICAI_FREEFORM || [];
  var SEASONING = window.PEICAI_SEASONING || [];
  var byId = {};
  FOODS.forEach(function(f){ byId[f.id]=f; });

  /* ---------- PRD 七大类映射 ---------- */
  var CAT_MAP = {
    staple:["jingmi","nuomi","xiaomi","xiaomai","yumi","shanyao","baihe","lianzi","qianshi","yiyiren","maiya","huangjing","yuzhu","fuling","hetao","heizhima","suanzaoren","xingren","taoren"],
    veg:["baicai","bocai","qincai","jiucai","luobo","huluobo","donggua","huanggua","kugua","sigua","nangua","qiezi","fanqie","tudou","lianou","zhusun","muer","xianggu","huanghuacai","xiancai","kongxincai","shengcai","woju","yangcong","dasuan","shengjiang","lajiao","yanxu","xilanqie"],
    meat:["zhurou","niurou","yangrou","jirou","yarou","erou","lurou","turou","jidan","yadan","ejiao"],
    aqua:["jiyu","liyu","caoyu","lianyu","heiyu","shanyu","daidaiyu","huanghuayu","xia","pangxie","geli","haidai","zicai","haishen","muli","youyu","niguiyu"],
    soy:["huangdou","lvdou","hongdou","heidou","doufu","chixiaodou","biandou","niunai"],
    fruit:["pingguo","li","tao","lizi","xigua","tianjie","putao","shiliu","ganju","chengzi","youzi","ningmeng","xiangjiao","boluo","lizhi","mangguo","mihoutao","caomei","yingtao","shizi","xing","pipa","yangmei","yezi","dazao","guiyuan","shanzha","sangshen","mugua","luohanguo","gouqi"],
    seasoning:["cu","hongtang","ye","jiu","bajiao","huajiao","hujiao","rougui","dingxiang","xiaohuixiang","chenpi","sharen","gancao","bohe","huoxiang","juemingzi","juhua","jinyinhua","fengmi"]
  };
  var CAT_NAMES={all:"全部",staple:"主食类",veg:"蔬菜类",meat:"肉蛋类",aqua:"水产类",soy:"豆奶制品",fruit:"水果类",seasoning:"调料类"};
  var foodCat={};
  Object.keys(CAT_MAP).forEach(function(c){ CAT_MAP[c].forEach(function(id){ foodCat[id]=c; }); });

  /* ---------- 钠(mg)/糖(g) 每100g 扩展数据（参考《中国食物成分表》第6版近似值） ---------- */
  var NUT_EXT={
    jidan:{na:131,sugar:.8},yadan:{na:107,sugar:1},niunai:{na:52,sugar:5},doufu:{na:7,sugar:1.5},
    haidai:{na:95,sugar:.5},zicai:{na:710,sugar:0},haishen:{na:503,sugar:0},muli:{na:462,sugar:0},
    xia:{na:165,sugar:0},pangxie:{na:270,sugar:0},geli:{na:480,sugar:0},youyu:{na:110,sugar:0},
    jiyu:{na:70},liyu:{na:72},caoyu:{na:45},lianyu:{na:55},heiyu:{na:48},shanyu:{na:70},
    daidaiyu:{na:150},huanghuayu:{na:55},niguiyu:{na:65},
    cu:{na:200,sugar:2},hongtang:{na:5,sugar:96},ye:{na:8,sugar:0},jiu:{na:5,sugar:3},fengmi:{na:4,sugar:82},
    jingmi:{na:3,sugar:.5},nuomi:{na:2,sugar:1},xiaomi:{na:4,sugar:1},xiaomai:{na:2,sugar:.2},yumi:{na:1,sugar:7},
    huangdou:{na:2,sugar:4},lvdou:{na:3,sugar:4},hongdou:{na:2,sugar:4},heidou:{na:3,sugar:2},chixiaodou:{na:2,sugar:3},biandou:{na:2,sugar:3},
    xigua:{na:3,sugar:5.5},ningmeng:{na:1,sugar:2.5},xiangjiao:{na:1,sugar:15.5},caomei:{na:4,sugar:4.9},
    youzi:{na:3,sugar:7},yingtao:{na:3,sugar:8},dazao:{na:6,sugar:67},guiyuan:{na:8,sugar:63},
    shanzha:{na:5,sugar:22},sangshen:{na:2,sugar:8},gouqi:{na:250,sugar:45},mugua:{na:8,sugar:7},luohanguo:{na:1,sugar:0},
    muer:{na:8,sugar:0},xianggu:{na:11,sugar:3},zhusun:{na:.4},yangcong:{na:4,sugar:4},
    zhurou:{na:57},niurou:{na:55},yangrou:{na:70},jirou:{na:63},yarou:{na:69},erou:{na:65},lurou:{na:75},turou:{na:45},
    hetao:{na:6,sugar:3},heizhima:{na:8,sugar:2},xingren:{na:8,sugar:4}
  };
  var CAT_NA={staple:6,veg:35,meat:60,aqua:80,soy:10,fruit:3,seasoning:30};
  function ext(f){
    var e=NUT_EXT[f.id]||{};
    var defNa=CAT_NA[foodCat[f.id]]!=null?CAT_NA[foodCat[f.id]]:20;
    var defSu=foodCat[f.id]==="fruit"?11:2;
    return {na:e.na!=null?e.na:defNa, sugar:e.sugar!=null?e.sugar:defSu};
  }

  /* ---------- emoji 兜底 ---------- */
  var CAT_EMOJI={staple:"🍚",veg:"🥬",meat:"🥩",aqua:"🐟",soy:"🥛",fruit:"🍎",seasoning:"🧂"};

  /* ---------- 规则索引 ---------- */
  var RULE_MAP={};
  RULES.forEach(function(r){ RULE_MAP[[r.food_a,r.food_b].sort().join("|")]=r; });
  var LEVEL_ORDER={forbidden:3,normal:2,recommend:1};
  var LEVEL_TEXT={forbidden:"禁忌搭配",normal:"不适宜搭配",recommend:"推荐搭配"};
  var LEVEL_TIP={
    forbidden:"该组合存在饮食禁忌，不建议同食",
    normal:"该搭配不甚合理，建议调整",
    recommend:"经典搭配，营养均衡"
  };
  var CABBAGE_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="8" cy="13" rx="2.8" ry="7.5" fill="#fff" opacity=".92"/><ellipse cx="12" cy="11.5" rx="3.1" ry="8.6" fill="#fff"/><ellipse cx="16" cy="13" rx="2.8" ry="7.5" fill="#fff" opacity=".92"/></svg>';

  /* ---------- 画布状态 ---------- */
  var items=[];           // {uid,id,baseG(每人份克数)}
  var uidSeq=1;
  var people=1;
  var taste="light";      // light/std/heavy
  var curCat="all";
  var curKw="";
  var lastAddedUid=null;

  /* ---------- 左栏：分类 + 列表 ---------- */
  function initLeft(){
    var cats=document.getElementById("pcCats");
    cats.innerHTML="";
    Object.keys(CAT_NAMES).forEach(function(c){
      var b=document.createElement("button");
      b.className="pc-cat"+(c==="all"?" on":"");
      b.textContent=CAT_NAMES[c];
      b.onclick=function(){
        curCat=c;
        Array.prototype.forEach.call(cats.children,function(x){x.classList.remove("on");});
        b.classList.add("on");
        renderFoodList();
      };
      cats.appendChild(b);
    });
    document.getElementById("pcSearch").addEventListener("input",function(e){
      curKw=e.target.value.trim();
      renderFoodList();
    });
    renderFoodList();
  }
  function renderFoodList(){
    var box=document.getElementById("pcFoodList");
    box.innerHTML="";
    var list=FOODS.filter(function(f){
      if(curCat!=="all" && foodCat[f.id]!==curCat) return false;
      if(curKw && f.name.indexOf(curKw)<0 && (f.alias||"").indexOf(curKw)<0) return false;
      return true;
    });
    if(!list.length){ box.innerHTML='<div class="nut-empty" style="grid-column:1/-1">没有匹配的食材</div>'; return; }
    list.forEach(function(f){
      var d=document.createElement("div");
      d.className="f-lib";
      d.draggable=true;
      var u=IMG[f.id]||"";
      d.innerHTML='<div class="fl-thumb" data-emoji="'+(CAT_EMOJI[foodCat[f.id]]||"🍽️")+'">'+(u?'<img src="'+u+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':"")+'</div>'+
        '<div class="fl-body"><div class="fl-name">'+f.name+'</div><div class="fl-g">默认 100g/人</div></div>';
      d.addEventListener("dragstart",function(e){
        e.dataTransfer.setData("text/plain","add:"+f.id);
        e.dataTransfer.effectAllowed="copy";
        d.classList.add("dragging");
      });
      d.addEventListener("dragend",function(){ d.classList.remove("dragging"); });
      d.addEventListener("click",function(){ addFood(f.id); });   // 移动端/点击添加
      box.appendChild(d);
    });
  }

  /* ---------- 画布：添加/删除/克数/人数 ---------- */
  function addFood(id){
    if(!byId[id]) return;
    var ex=items.filter(function(it){return it.id===id;})[0];
    if(ex){ ex.baseG=Math.min(ex.baseG+100,2000); lastAddedUid=ex.uid; }
    else { var it={uid:uidSeq++,id:id,baseG:100}; items.push(it); lastAddedUid=it.uid; }
    renderAll();
  }
  function removeFood(uid){ items=items.filter(function(it){return it.uid!==uid;}); renderAll(); }
  function changeG(uid,delta,absVal){
    var it=items.filter(function(x){return x.uid===uid;})[0]; if(!it) return;
    if(absVal!=null){ it.baseG=Math.max(25,Math.min(2000,absVal)); }
    else { it.baseG=Math.max(25,Math.min(2000,it.baseG+delta)); }
    renderAll();
  }
  function totalG(it){ return Math.round(it.baseG*people); }

  function initCanvasDrop(){
    var cv=document.getElementById("pcCanvas");
    cv.addEventListener("dragover",function(e){
      e.preventDefault();
      var kind=(e.dataTransfer.getData("text/plain")||"").split(":")[0];
      if(kind==="add"||kind==="sort"){ e.dataTransfer.dropEffect=kind==="sort"?"move":"copy"; cv.classList.add("dragover"); }
    });
    cv.addEventListener("dragleave",function(e){ if(e.target===cv) cv.classList.remove("dragover"); });
    cv.addEventListener("drop",function(e){
      e.preventDefault();
      cv.classList.remove("dragover");
      var raw=e.dataTransfer.getData("text/plain")||"";
      var ps=raw.split(":");
      if(ps[0]==="add"){ addFood(ps[1]); }
      else if(ps[0]==="sort"){
        var fromUid=parseInt(ps[1],10);
        var target=e.target.closest(".cv-item");
        if(target){
          var toUid=parseInt(target.getAttribute("data-uid"),10);
          var fromIdx=items.findIndex(function(x){return x.uid===fromUid;});
          var toIdx=items.findIndex(function(x){return x.uid===toUid;});
          if(fromIdx>=0&&toIdx>=0&&fromIdx!==toIdx){
            var mv=items.splice(fromIdx,1)[0];
            items.splice(toIdx,0,mv);
            renderCanvas(); validate();
          }
        }
      }
    });
  }

  /* ---------- 校验引擎：两两组合，取最高风险 ---------- */
  function pairKey(a,b){ return [a,b].sort().join("|"); }
  // 某食材与画布其他食材的全部判定（调料不参与等级、同种食材不校验）
  function pairsOf(uid){
    var me=items.filter(function(x){return x.uid===uid;})[0];
    var out=[];
    if(!me) return out;
    items.forEach(function(o){
      if(o.uid===uid||o.id===me.id) return;
      if(SEASONING.indexOf(me.id)>=0||SEASONING.indexOf(o.id)>=0) return;
      var r=RULE_MAP[pairKey(me.id,o.id)];
      if(r) out.push({other:o,rule:r});
    });
    return out;
  }
  // 画布全部配对
  function allPairs(){
    var out=[];
    for(var i=0;i<items.length;i++){
      for(var j=i+1;j<items.length;j++){
        var a=items[i],b=items[j];
        if(a.id===b.id) continue;
        if(SEASONING.indexOf(a.id)>=0||SEASONING.indexOf(b.id)>=0) continue;
        var r=RULE_MAP[pairKey(a.id,b.id)];
        if(r) out.push({a:a,b:b,rule:r});
      }
    }
    return out;
  }
  function highestLevel(pairs){
    var lv=null;
    pairs.forEach(function(p){ if(!lv||LEVEL_ORDER[p.rule.level]>LEVEL_ORDER[lv]) lv=p.rule.level; });
    return lv;
  }

  /* ---------- 画布渲染 ---------- */
  function renderCanvas(){
    var cv=document.getElementById("pcCanvas");
    var list=document.getElementById("pcCanvasList");
    cv.classList.toggle("has-items",items.length>0);
    list.innerHTML="";
    items.forEach(function(it){
      var f=byId[it.id];
      var u=IMG[f.id]||"";
      var d=document.createElement("div");
      d.className="cv-item";
      d.setAttribute("data-uid",it.uid);
      d.draggable=true;
      d.innerHTML=
        '<div class="cv-thumb" data-emoji="'+(CAT_EMOJI[foodCat[f.id]]||"🍽️")+'">'+(u?'<img src="'+u+'" alt="" onerror="this.style.display=\'none\'">':"")+'</div>'+
        '<div class="cv-main"><div><span class="cv-name">'+f.name+'</span><span class="cv-cat">'+CAT_NAMES[foodCat[f.id]]+'</span></div>'+
        '<div class="cv-ctrl"><button data-act="minus" type="button">−</button>'+
        '<input type="number" min="25" max="2000" step="25" value="'+totalG(it)+'"><span class="unit">g/共'+people+'人</span>'+
        '<button data-act="plus" type="button">+</button></div></div>'+
        '<button class="cv-del" data-act="del" type="button">✕</button>';
      d.addEventListener("dragstart",function(e){ e.dataTransfer.setData("text/plain","sort:"+it.uid); e.dataTransfer.effectAllowed="move"; });
      d.querySelector('[data-act=minus]').onclick=function(){changeG(it.uid,-50);};
      d.querySelector('[data-act=plus]').onclick=function(){changeG(it.uid,50);};
      d.querySelector('input').onchange=function(e){
        var v=parseFloat(e.target.value);
        if(isNaN(v)) return;
        changeG(it.uid,null,v/people);
      };
      d.querySelector('[data-act=del]').onclick=function(){removeFood(it.uid);};
      list.appendChild(d);
    });
  }

  // 校验渲染：badge + 风险条
  function validate(){
    var ap=allPairs();
    var hasForbidden=ap.some(function(p){return p.rule.level==="forbidden";});
    var hasNormal=ap.some(function(p){return p.rule.level==="normal";});
    var hasRec=ap.some(function(p){return p.rule.level==="recommend";});
    // 每张食材卡角标
    items.forEach(function(it){
      var el=document.querySelector('.cv-item[data-uid="'+it.uid+'"]');
      if(!el) return;
      var old=el.querySelector(".p-badge"); if(old) old.remove();
      var ps=pairsOf(it.uid);
      if(!ps.length) return;
      var lv=highestLevel(ps);
      var b=document.createElement("i");
      b.className="p-badge b-"+(lv==="recommend"?"v":lv==="normal"?"o":"x");
      if(lv==="recommend") b.innerHTML=CABBAGE_SVG;
      else b.textContent=lv==="forbidden"?"✕":"○";
      b.title=LEVEL_TEXT[lv]+"：点击查看详情";
      b.onclick=function(e){e.stopPropagation();openPairModal(it,ps);};
      el.appendChild(b);
      if(lv==="forbidden") el.classList.add("danger"); else el.classList.remove("danger");
      if(it.uid===lastAddedUid){ b.classList.add("pop"); setTimeout(function(){b.classList.remove("pop");},2000); }
    });
    lastAddedUid=null;
    // 顶部风险条
    var alert=document.getElementById("pcAlert");
    if(items.length<2){ alert.hidden=true; }
    else if(hasForbidden){
      alert.hidden=false; alert.className="pc-alert danger";
      alert.innerHTML="🚫 当前存在禁忌搭配，建议移除相关食材";
    } else if(hasNormal){
      alert.hidden=false; alert.className="pc-alert warn";
      alert.innerHTML="⚠ 当前存在不适宜搭配，可酌情调整";
    } else if(hasRec){
      alert.hidden=false; alert.className="pc-alert ok";
      alert.innerHTML="✓ 当前搭配均衡合理";
    } else {
      alert.hidden=false; alert.className="pc-alert ok";
      alert.style.background="#eaf4fb";alert.style.color="#2d7da0";alert.style.borderColor="#9fd4ec";
      alert.innerHTML="💡 继续添加食材查看搭配建议";
    }
    if(items.length<2||hasForbidden||hasNormal||hasRec){ alert.style.background="";alert.style.color="";alert.style.borderColor=""; }
    return {hasForbidden:hasForbidden,hasNormal:hasNormal};
  }

  /* ---------- 判定详情弹层 ---------- */
  function openPairModal(it,ps){
    var f=byId[it.id];
    document.getElementById("pairModalTitle").textContent="「"+f.name+"」的搭配判定（"+ps.length+"组）";
    var body=document.getElementById("pairModalBody");
    var order={forbidden:0,normal:1,recommend:2};
    ps=ps.slice().sort(function(a,b){return order[a.rule.level]-order[b.rule.level];});
    body.innerHTML=ps.map(function(p){
      var lv=p.rule.level;
      var ic=lv==="recommend"?'<i class="pr-ic v">'+CABBAGE_SVG+'</i>':lv==="normal"?'<i class="pr-ic o">○</i>':'<i class="pr-ic x">✕</i>';
      return '<div class="pr-row">'+ic+'<div><div class="pr-names">'+f.name+' + '+byId[p.other.id].name+'<span style="font-weight:400;font-size:11px;color:#9fb0a7;margin-left:6px">'+LEVEL_TEXT[lv]+'</span></div>'+
        '<div class="pr-desc">'+p.rule.description+'</div><div class="pr-src">依据：'+p.rule.source+'</div></div></div>';
    }).join("");
    document.getElementById("pairModal").hidden=false;
  }
  function initModals(){
    ["pairModal","dishModal"].forEach(function(mid){
      document.getElementById(mid).addEventListener("click",function(e){ if(e.target===this) this.hidden=true; });
    });
    document.getElementById("pairModalClose").onclick=function(){document.getElementById("pairModal").hidden=true;};
    document.getElementById("dishModalClose").onclick=function(){document.getElementById("dishModal").hidden=true;};
    document.addEventListener("keydown",function(e){ if(e.key==="Escape"){document.getElementById("pairModal").hidden=true;document.getElementById("dishModal").hidden=true;} });
  }

  /* ---------- 营养分析 ---------- */
  var DAILY={kcal:2000,protein:65,fat:60,carbs:300,na:2000,sugar:50,fiber:25};
  function calcNutrition(){
    var t={kcal:0,protein:0,fat:0,carbs:0,na:0,sugar:0,fiber:0};
    var w=0;
    items.forEach(function(it){
      var f=byId[it.id], n=f.nutrition, g=totalG(it), x=ext(f), k=g/100;
      w+=g;
      t.kcal+=(+n.kcal||0)*k; t.protein+=(+n.protein||0)*k; t.fat+=(+n.fat||0)*k; t.carbs+=(+n.carbs||0)*k; t.fiber+=(+n.fiber||0)*k;
      t.na+=(+x.na||0)*k; t.sugar+=(+x.sugar||0)*k;
    });
    return {t:t,w:w};
  }
  function pctColor(key,pct){
    if(key==="fiber"||key==="protein"){ return pct>=50&&pct<=150?"g":"y"; }
    return pct>110?"r":pct>=80?"y":"g";
  }
  function renderNutrition(r){
    var box=document.getElementById("nutGrid");
    document.getElementById("nutTotalW").textContent="总重 "+Math.round(r.w)+"g";
    if(!items.length){ box.innerHTML='<div class="nut-empty">添加食材后显示营养数据</div>'; return; }
    var rows=[
      ["kcal","总热量","kcal",0],["protein","蛋白质","g",1],
      ["fat","脂肪","g",1],["carbs","碳水化合物","g",1],
      ["na","钠","mg",0],["sugar","糖","g",1],
      ["fiber","膳食纤维","g",1]
    ];
    box.innerHTML=rows.map(function(row){
      var key=row[0],label=row[1],unit=row[2],dec=row[3];
      var v=r.t[key], pct=Math.round(v/DAILY[key]*100);
      var c=pctColor(key,pct);
      var val=v>=100?Math.round(v):v.toFixed(dec);
      return '<div class="nut-item"><div class="ni-top"><span>'+label+'</span><span class="ni-pct '+c+'">'+pct+'% 日需</span></div>'+
        '<div class="ni-val">'+val+' <small style="font-size:10px;font-weight:400;color:#9fb0a7">'+unit+'</small></div>'+
        '<div class="ni-bar"><div class="ni-fill '+c+'" style="width:'+Math.min(100,pct)+'%"></div></div></div>';
    }).join("");
  }

  /* ---------- 辅料计算（三档口味 + 勺换算 + 高盐/生抽扣减） ---------- */
  var TASTE_CONF={
    light:{salt:.0045,oil:.025,soy:.03,dark:.008,sugar:.005,vinegar:0,wine:0,label:"清淡档"},
    std:  {salt:.006, oil:.035,soy:.05,dark:.015,sugar:.01, vinegar:.015,wine:.02,label:"标准档"},
    heavy:{salt:.008, oil:.05, soy:.07,dark:.022,sugar:.02, vinegar:.03, wine:.03,label:"重口档"}
  };
  function fmt(v){ if(v<3) return (Math.round(v*2)/2).toFixed(1); return String(Math.round(v)); }
  function spoon(g,per){ var n=g/per; if(n<0.25) return ""; return "≈"+(n>=1?Math.round(n*2)/2:Math.round(n*4)/4)+(per===15?"汤勺":"小勺"); }
  function renderAux(r){
    var box=document.getElementById("auxGrid");
    if(!items.length){ box.innerHTML='<div class="nut-empty">添加食材后计算辅料用量</div>'; return; }
    var c=TASTE_CONF[taste], W=r.w;
    document.getElementById("tasteLabel").textContent=c.label;
    var hasMeat=items.some(function(it){return foodCat[it.id]==="meat"||foodCat[it.id]==="aqua";});
    var hasAqua=items.some(function(it){return foodCat[it.id]==="aqua";});
    // 生抽自带盐（约16%）需从放盐量中扣减；高盐食材钠折盐扣减
    var soyG=W*c.soy, darkG=W*c.dark;
    var soySalt=(soyG+darkG)*0.16;
    var foodSaltDeduct=0;
    items.forEach(function(it){
      var f=byId[it.id], g=totalG(it), x=ext(f);
      if(x.na>200) foodSaltDeduct+=Math.max(0,(x.na-200))*g/100/393*0.25;
    });
    var saltG=Math.max(0,W*c.salt-soySalt-foodSaltDeduct);
    var oilG=W*c.oil, sugarG=W*c.sugar;
    var rows=[
      ["食用盐",fmt(saltG)+"g",spoon(saltG,5)+(foodSaltDeduct>0||soyG>5?"（已扣生抽/食材盐）":"")],
      ["食用油",fmt(oilG)+"g",spoon(oilG,10)],
      ["生抽",fmt(soyG)+"g",spoon(soyG,15)],
      ["老抽",fmt(darkG)+"g",darkG<5?"少量上色":spoon(darkG,15)],
      ["白砂糖",fmt(sugarG)+"g",spoon(sugarG,4)]
    ];
    var vinegarG=W*(hasAqua?Math.max(c.vinegar,.015):c.vinegar);
    if(vinegarG>0) rows.push(["醋",fmt(vinegarG)+"g",spoon(vinegarG,15)]);
    if(hasMeat){ var wineG=Math.max(W*c.wine,W*.015); rows.push(["料酒",fmt(wineG)+"g",spoon(wineG,15)]); }
    box.innerHTML=rows.map(function(rw){
      return '<div class="aux-item"><span>'+rw[0]+'</span><b>'+rw[1]+(rw[2]?'<span class="spoon">'+rw[2]+'</span>':"")+'</b></div>';
    }).join("");
  }

  /* ---------- 菜品匹配 ---------- */
  function matchDishes(risks){
    var ids={}; items.forEach(function(it){ids[it.id]=true;});
    var res=[];
    DISHES.forEach(function(d){
      var mainsHit=d.mains.filter(function(id){return ids[id];}).length;
      var coreHit=d.core.filter(function(id){return ids[id];}).length;
      var exact=d.mains.every(function(id){return ids[id];});
      if(exact){
        res.push({d:d,pct:96,mode:"精确匹配"});
      } else if(coreHit===d.core.length){
        var extra=(d.mains.length-d.core.length)?(mainsHit-d.core.length)/(d.mains.length-d.core.length):0;
        res.push({d:d,pct:Math.round(70+extra*24),mode:"核心匹配"});
      } else if(coreHit>=1){
        var p=Math.round(coreHit/d.core.length*50+(mainsHit-coreHit)*5);
        if(p>=30) res.push({d:d,pct:p,mode:"推荐匹配"});
      }
    });
    return res.sort(function(a,b){return b.pct-a.pct;}).slice(0,6);
  }
  function dishEmoji(fid){ return CAT_EMOJI[foodCat[fid]]||"🍽️"; }
  function renderDishes(risks){
    var box=document.getElementById("dishList");
    if(items.length<2){ box.innerHTML='<div class="nut-empty">添加 2 种以上食材，自动匹配家常菜品</div>'; return; }
    if(risks.hasForbidden){
      box.innerHTML='<div class="dish-blocked">🚫 当前存在饮食禁忌，未推荐菜品<br>请调整或移除相关食材后再查看菜品推荐</div>';
      return;
    }
    var list=matchDishes(risks);
    if(!list.length){
      box.innerHTML='<div style="font-size:12px;color:#7a9187;margin-bottom:8px">暂无标准菜品，试试这几种通用做法：</div>'+
        FREEFORM.map(function(ff){
          return '<div class="freeform-card"><h5>'+ff.name+' · <small style="font-weight:400">'+ff.desc+'</small></h5><ol>'+
            ff.steps.map(function(s){return "<li>"+s+"</li>";}).join("")+'</ol></div>';
        }).join("");
      return;
    }
    box.innerHTML=list.map(function(m){
      var d=m.d, u=IMG[d.img]||"";
      return '<div class="dish-item" data-did="'+d.id+'"><div class="dish-main">'+
        '<div class="dish-img" data-emoji="'+dishEmoji(d.img)+'">'+(u?'<img src="'+u+'" alt="" onerror="this.style.display=\'none\'">':"")+'</div>'+
        '<div class="dish-info"><div class="dish-name">'+d.name+' <span class="dish-tag">'+d.tag+'</span>'+(risks.hasNormal?'<span class="dish-warn">搭配建议调整</span>':"")+'</div>'+
        '<div class="dish-meta">'+m.mode+' · ⏱ '+d.time+'分钟 · 难度：'+d.level+'</div>'+
        '<div class="match-bar"><div class="match-fill" style="width:'+m.pct+'%"></div></div>'+
        '<div class="match-pct">匹配度 '+m.pct+'%</div></div></div>'+
        '<div class="dish-detail"><h5>主料（画布已有）</h5><p style="margin:2px 0;font-size:12px;color:#3f5a4d">'+
          d.mains.map(function(id){return byId[id]?byId[id].name:id;}).join("、")+'</p>'+
        '<h5>特色辅料</h5><p style="margin:2px 0;font-size:12px;color:#3f5a4d">'+d.aux+'（盐油等用量见上方“辅料用量建议”）</p>'+
        '<h5>做法步骤</h5><ol>'+d.steps.map(function(s){return "<li>"+s+"</li>";}).join("")+'</ol>'+
        '<div class="dd-tips">💡 小贴士：'+d.tips+'</div></div></div>';
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll(".dish-main"),function(el){
      el.onclick=function(){ el.parentNode.classList.toggle("open"); };
    });
  }

  /* ---------- 采购清单（一键复制） ---------- */
  function initShopping(){
    var btn=document.createElement("button");
    btn.type="button";
    btn.className="tb-clear";
    btn.style.cssText="margin:0 0 10px;border-color:rgba(126,200,227,.5);color:var(--sky-deep,#2d7da0);width:100%;padding:9px";
    btn.textContent="📋 复制采购清单";
    var host=document.querySelector(".pc-right-scroll .pc-disclaimer");
    host.parentNode.insertBefore(btn,host);
    btn.onclick=function(){
      if(!items.length){ btn.textContent="画布还是空的～"; setTimeout(function(){btn.textContent="📋 复制采购清单";},1500); return; }
      var r=calcNutrition();
      var lines=["【采购清单】用餐人数："+people+"人","","主料："];
      items.forEach(function(it){ lines.push("· "+byId[it.id].name+"  "+totalG(it)+"g"); });
      var c=TASTE_CONF[taste];
      lines.push("","调料（"+c.label+"）：");
      lines.push("· 盐/油/生抽/糖等用量详见页面“辅料用量建议”");
      lines.push("","— 由食养本草·智能配菜生成");
      var txt=lines.join("\n");
      (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(
        function(){btn.textContent="✓ 已复制到剪贴板";setTimeout(function(){btn.textContent="📋 复制采购清单";},1600);},
        function(){
          var ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();
          try{document.execCommand("copy");btn.textContent="✓ 已复制";}catch(e){btn.textContent="复制失败，请手动选择";}
          document.body.removeChild(ta);
          setTimeout(function(){btn.textContent="📋 复制采购清单";},1600);
        }
      );
    };
  }

  /* ---------- 统一刷新 ---------- */
  function renderAll(){
    renderCanvas();
    var risks=validate();
    var r=calcNutrition();
    renderNutrition(r);
    renderAux(r);
    renderDishes(risks);
  }

  /* ---------- 工具栏 ---------- */
  function initToolbar(){
    document.getElementById("pplMinus").onclick=function(){ if(people>1){people--;document.getElementById("pplVal").textContent=people;renderAll();} };
    document.getElementById("pplPlus").onclick=function(){ if(people<10){people++;document.getElementById("pplVal").textContent=people;renderAll();} };
    Array.prototype.forEach.call(document.querySelectorAll("#tasteSeg button"),function(b){
      b.onclick=function(){
        taste=b.getAttribute("data-t");
        Array.prototype.forEach.call(document.querySelectorAll("#tasteSeg button"),function(x){x.classList.remove("on");});
        b.classList.add("on");
        renderAll();
      };
    });
    document.getElementById("pcClear").onclick=function(){ items=[]; renderAll(); };
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded",function(){
    initLeft();
    initCanvasDrop();
    initToolbar();
    initModals();
    initShopping();
    renderAll();
  });
})();
