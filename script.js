(() => {
  "use strict";
  const aliases = {all:"all",saree:"saree",blouse:"blouse",maggam:"maggam",bridal:"bridal",kids:"kids",lehenga:"lehenga",computer:"computer",custom:"custom"};
  function initFilters() {
    const group=document.querySelector(".gallery-filters"), grid=document.querySelector(".collection-grid");
    if(!group||!grid)return;
    const buttons=[...group.querySelectorAll("button[data-filter]")], cards=[...grid.querySelectorAll(".collection-card[data-category]")];
    if(!buttons.length||!cards.length)return;
    function apply(category,selected){
      category=aliases[category]||"all";
      cards.forEach(card=>{const visible=category==="all"||card.dataset.category===category;card.hidden=!visible;card.setAttribute("aria-hidden",String(!visible));if(visible)card.removeAttribute("tabindex");else card.setAttribute("tabindex","-1");});
      buttons.forEach(button=>{const active=button===selected;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});
    }
    buttons.forEach(button=>button.addEventListener("click",event=>{event.preventDefault();apply(button.dataset.filter,button);}));
    const initial=buttons.find(button=>button.dataset.filter==="all")||buttons[0];apply(initial.dataset.filter,initial);
  }
  function initSmoothScrolling(){
    document.addEventListener("click",event=>{
      const link=event.target.closest("a[href^='#']");if(!link)return;
      const href=link.getAttribute("href");
      if(!href||href==="#"){event.preventDefault();window.scrollTo({top:0,behavior:"smooth"});return;}
      const target=document.getElementById(href.slice(1));if(!target)return;
      event.preventDefault();target.scrollIntoView({behavior:"smooth",block:"start"});
      if(window.history&&window.history.replaceState)window.history.replaceState(null,"",href);
    });
  }
  function initNavigationState(){
    const sections=[...document.querySelectorAll("main section[id]")],links=[...document.querySelectorAll(".main-nav a[href^='#']")];if(!sections.length||!links.length)return;
    function update(){let current=sections[0].id;const threshold=window.scrollY+Math.min(180,window.innerHeight*.25);sections.forEach(section=>{if(section.offsetTop<=threshold)current=section.id;});links.forEach(link=>{const active=link.getAttribute("href")==="#"+current;link.classList.toggle("active",active);if(active)link.setAttribute("aria-current","location");else link.removeAttribute("aria-current");});}
    window.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update,{passive:true});update();
  }
  function initReveal(){
    const items=document.querySelectorAll(".reveal");if(!items.length)return;
    if("IntersectionObserver"in window){const observer=new IntersectionObserver((entries,observerInstance)=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("active");observerInstance.unobserve(entry.target);}}),{threshold:.08});items.forEach(item=>observer.observe(item));}
    else items.forEach(item=>item.classList.add("active"));
  }
  function init(){initFilters();initSmoothScrolling();initNavigationState();initReveal();const year=document.getElementById("year");if(year)year.textContent=String(new Date().getFullYear());}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();