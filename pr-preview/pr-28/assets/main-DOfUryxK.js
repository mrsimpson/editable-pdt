import{a as e,i as t,o as n,t as r}from"./styles-Corsh3BK.js";var i=[{kind:`human`,text:`Let's design a platform that connects small farms with the city's kitchens. Use pdt42.`},{kind:`run`,command:`pdt42 next`,output:`Next: D1 · Map the ecosystem

Nothing is modelled yet. Start with D1 — or with E1 if you still need to find the opportunity.

> Who is in the ecosystem, clustered into which roles?

Run \`pdt42 guide step D1\` for the brief.`},{kind:`run`,command:`pdt42 guide step D1`,output:`# D1 · Map the ecosystem

Phase: Strategy Design · Status: todo

> Who is in the ecosystem, clustered into which roles?

## File

Write this step in \`2-design/d1-ecosystem.pdt42.md\` (any \`*.pdt42.md\` file works; this is the convention). Wrap blocks in \`\`\`pdt42 fences.

## Dependencies

- \`:::ecosystem\` from E1 — optional via platform.ecosystem; none yet
- \`:::brief\` from E7 — optional via platform.brief; none yet

## How

1. Brainstorm entities alone first, then together; cluster similar ones into entity-roles (\`clusters:\`).
2. Give each a \`role\`: owner, stakeholder, peer-consumer, peer-producer or partner — by the key value it produces or consumes.
3. Keep at most five roles in the peer spectrum.
4. Add the \`platform\` block with its owners.

…`},{kind:`agent`,text:`Asks who takes part, then writes the chapter: the platform, its owner and two entity-roles.`},{kind:`write`,file:`2-design/d1-ecosystem.pdt42.md`,excerpt:`## Small-scale farmers

Family farms within sixty kilometres. They grow well; selling is what costs them.

\`\`\`pdt42
:::entity
id: e-farmers
title: Small-scale farmers
role: peer-producer
:::
\`\`\``},{kind:`run`,command:`pdt42 validate`,output:`W011 2-design/d1-ecosystem.pdt42.md:8  2-design/d1-ecosystem.pdt42.md (D1 Map the ecosystem) shows no Ecosystem Canvas — add a \`:::canvas\` block with \`canvas: ecosystem\`
H010 2-design/d1-ecosystem.pdt42.md:32  Small-scale farmers is connected to nothing else in the model
H104 2-design/d1-ecosystem.pdt42.md:32  Small-scale farmers's portrait lacks potential, goals or pressures, gains
H010 2-design/d1-ecosystem.pdt42.md:44  Restaurants is connected to nothing else in the model
H104 2-design/d1-ecosystem.pdt42.md:44  Restaurants's portrait lacks potential, goals or pressures, gains

4 elements in 1 files — 0 errors, 1 warnings, 4 hints`},{kind:`agent`,text:`W011: the chapter lacks its canvas. Places it under the title.`},{kind:`write`,file:`2-design/d1-ecosystem.pdt42.md`,excerpt:`# Map the ecosystem

\`\`\`pdt42
:::canvas
id: cv-ecosystem
canvas: ecosystem
:::
\`\`\``},{kind:`run`,command:`pdt42 validate`,output:`H010 2-design/d1-ecosystem.pdt42.md:39  Small-scale farmers is connected to nothing else in the model
H104 2-design/d1-ecosystem.pdt42.md:39  Small-scale farmers's portrait lacks potential, goals or pressures, gains
H010 2-design/d1-ecosystem.pdt42.md:51  Restaurants is connected to nothing else in the model
H104 2-design/d1-ecosystem.pdt42.md:51  Restaurants's portrait lacks potential, goals or pressures, gains

4 elements in 1 files — 0 errors, 0 warnings, 4 hints`},{kind:`run`,command:`pdt42 next`,output:`Next: D2 · Portray the entity-roles

Everything up to D1 is in place.

> What is each role's context, what drives it, and what gains does it seek?

Run \`pdt42 guide step D2\` for the brief.`}],a=`./harvest-commons/`;function o(e,t={},...n){let r=document.createElement(e);for(let[e,n]of Object.entries(t))r.setAttribute(e,n);return r.append(...n),r}function s(){let r=o(`div`,{class:`method__grid`});for(let i of e){let e=o(`ol`,{class:`method__steps`});for(let r of n.filter(e=>e.phase===i.id)){let n=t.find(e=>e.id===r.canvas);e.append(o(`li`,{},o(`a`,{href:`${a}#${r.file}`,title:r.question},o(`span`,{class:`method__id`},r.id),o(`span`,{class:`method__title`},r.title),o(`span`,{class:`method__canvas`},n?n.title:`no canvas of its own`))))}r.append(o(`section`,{class:`method__phase method__phase--${i.id}`},o(`h3`,{class:`method__name`},i.title),o(`p`,{class:`method__question`},i.question),e))}return r}var c=e=>new Promise(t=>setTimeout(t,e));function l(e,t,n){let r=0;return async function(){let i=++r,a=()=>i===r;e.replaceChildren();let s=t=>{let n=e.scrollHeight-e.scrollTop-e.clientHeight<48;return e.append(t),n&&(e.scrollTop=e.scrollHeight),t},l=async(e,t,r)=>{if(!n)return void(e.textContent=t);for(let n=1;n<=t.length&&a();n++)e.textContent=t.slice(0,n),await c(r)},u=async(t,r,i)=>{if(!n)return void(t.textContent=r);for(let n of r.split(`
`)){if(!a())return;t.textContent+=`${t.textContent?`
`:``}${n}`,e.scrollTop=e.scrollHeight,await c(i)}};for(let e of t){if(!a())return;if(e.kind===`human`||e.kind===`agent`){let t=o(`span`);s(o(`p`,{class:`session__${e.kind}`},o(`span`,{class:`session__who`},e.kind===`human`?`you`:`agent`),t)),await l(t,e.text,e.kind===`human`?22:12)}else if(e.kind===`run`){let t=o(`span`);s(o(`div`,{class:`session__cmd`},o(`span`,{class:`session__prompt`},`$ `),t)),await l(t,e.command,55),n&&await c(350),await u(s(o(`pre`,{class:`session__out`})),e.output,30)}else s(o(`div`,{class:`session__write`},`✎ ${e.file}`)),await u(s(o(`pre`,{class:`session__file`})),e.excerpt,45);n&&await c(e.kind===`run`?1400:700)}}}function u(){let e=document.getElementById(`session-screen`);if(!e)return;let t=!matchMedia(`(prefers-reduced-motion: reduce)`).matches,n=l(e,i,t);if(document.getElementById(`session-replay`)?.addEventListener(`click`,()=>void n()),!t||!(`IntersectionObserver`in window))return void n();let r=new IntersectionObserver(e=>{e.some(e=>e.isIntersecting)&&(r.disconnect(),n())},{threshold:.4});r.observe(e)}function d(){document.getElementById(`method-map`)?.append(s()),u(),r();let e=document.getElementById(`copy`);e?.addEventListener(`click`,()=>{let t=document.getElementById(`start-cmd`)?.textContent??``;navigator.clipboard?.writeText(t).then(()=>{e.textContent=`✓`,setTimeout(()=>e.textContent=`⧉`,1500)},()=>void 0)});for(let e of document.querySelectorAll(`.row__zoom`)){let t=e.querySelector(`img`);t&&(e.href=t.src)}}d();