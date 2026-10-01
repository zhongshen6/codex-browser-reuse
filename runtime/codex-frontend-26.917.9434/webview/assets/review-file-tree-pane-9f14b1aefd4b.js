import{n as e}from"./rolldown-runtime-2d059c5e81f4.js";import{$3 as t,$O as n,Bm as r,C_ as i,Df as a,FX as o,GK as s,I3 as c,K2 as l,LX as u,Of as d,PI as f,Q3 as p,RI as m,S_ as h,VI as g,W2 as _,Xm as v,Y2 as y,Yh as b,Ym as x,Z3 as S,Zh as C,__ as w,ag as T,e6 as E,ek as D,g_ as O,iW as k,ig as A,n4 as j,vL as M,wL as N,yL as P,zm as F}from"./app-shared-dc8f183e4945.js";import{$at as ee,$en as te,$ln as ne,Bfn as re,CW as ie,E6t as ae,JO as oe,Net as I,Qln as se,SW as ce,T6t as L,_ft as le,cU as R,cft as z,dU as ue,eot as de,fft as fe,itn as pe,iun as me,jet as he,lft as ge,mnt as _e,nun as ve,ok as ye,pft as be,pnt as B,qO as xe,run as Se,sU as Ce,sk as we,uft as Te,vft as Ee,xW as De}from"./app-initial-fc9a33fdda88.js";import{n as Oe,r as ke,t as Ae}from"./use-target-apps-8bf9a830896e.js";import{a as je,c as Me,d as V,l as Ne,o as Pe,u as Fe}from"./review-preferences-model-9487fa81dc5c.js";var Ie,Le,Re,ze,Be,H,Ve,He,Ue;function We(){return(We=e((()=>{Ie=`file-tree-container`,Le=`data-file-tree-style`,Re=`data-file-tree-unsafe-css`,ze=`data-file-tree-scrollbar-measure`,Be=`data-file-tree-scrollbar-gutter-measured`,H=`--trees-scrollbar-gutter-measured`,Ve=`header`,He=`context-menu`,Ue=`context-menu-trigger`})))()}function Ge(e,t,n){let r=e==null?null:(0,W.jsx)(`div`,{slot:Ve,children:e}),i=t!=null&&n!=null?(0,W.jsx)(`div`,{slot:He,children:t(n.item,n.context)}):null;return r==null&&i==null?null:(0,W.jsxs)(W.Fragment,{children:[r,i]})}function Ke(e,t){return typeof window>`u`&&t!=null?(0,W.jsxs)(W.Fragment,{children:[(0,W.jsx)(`template`,{shadowrootmode:`open`,dangerouslySetInnerHTML:{__html:t.shadowHtml}}),e]}):(0,W.jsx)(W.Fragment,{children:e})}function qe(e){let t=e.shadowRoot;return t?.querySelector(`[data-file-tree-id]`)instanceof HTMLElement||t?.querySelector(`[data-file-tree-id]`)instanceof SVGElement||e.querySelector(`template[shadowrootmode="open"]`)instanceof HTMLTemplateElement}function Je(e,t,n,r,i){let a={...e??{}};if(t!=null&&delete a.header,n){let t=e?.contextMenu,n=t?.onClose,o=t?.onOpen;a.contextMenu={...t??{},enabled:!0,onClose:()=>{n?.(),r()},onOpen:(e,t)=>{i(e,t),o?.(e,t)}},delete a.contextMenu.render}return a.header!=null||a.contextMenu!=null?a:void 0}function Ye({header:e,id:t,model:n,preloadedData:r,renderContextMenu:i,...a}){let[o,s]=(0,U.useState)(null),[c,l]=(0,U.useState)(null),u=(0,U.useRef)(n.getComposition()),d=(0,U.useRef)(n);d.current!==n&&(d.current=n,u.current=n.getComposition());let f=i!=null,p=(0,U.useCallback)(()=>{s(null)},[]),m=(0,U.useCallback)((e,t)=>{s({context:t,item:e})},[]),h=u.current,g=(0,U.useMemo)(()=>Je(h,e,f,p,m),[h,p,m,f,e]),_=(0,U.useCallback)(e=>{l(e)},[]);(0,U.useEffect)(()=>{f||s(null)},[f]),Xe(()=>{n.setComposition(g)},[g,n]),Xe(()=>{if(c!=null)return r!=null&&qe(c)?n.hydrate({fileTreeContainer:c}):n.render({fileTreeContainer:c}),()=>{n.unmount(),n.setComposition(h)}},[h,c,n,r]);let v=Ke(Ge(e,i,o),r),y=t??r?.id,b={"--trees-item-height":`${String(n.getItemHeight())}px`,"--trees-density-override":n.getDensityFactor(),...a.style};return(0,W.jsx)(Ie,{...a,id:y,ref:_,style:b,suppressHydrationWarning:r!=null,children:v})}var U,W,Xe;function Ze(){return(Ze=e((()=>{We(),U=E(),W=c(),Xe=typeof window>`u`?U.useEffect:U.useLayoutEffect})))()}function Qe(e,t){if(typeof e==`number`)return{itemHeight:t??$e.default.itemHeight,factor:e};let n=$e[e??`default`];return{itemHeight:t??n.itemHeight,factor:n.factor}}var $e;function et(){return(et=e((()=>{$e={compact:{itemHeight:24,factor:.8},default:{itemHeight:30,factor:1},relaxed:{itemHeight:36,factor:1.2}}})))()}var tt;function nt(){return(nt=e((()=>{et(),tt=$e.default.itemHeight})))()}var rt;function G(){return(G=e((()=>{rt=`@layer base, theme, unsafe;

@layer base {
  :host {
    /*
      CSS variables use a fallback stack to ensure user and theme colors slot
      in with ease. User colors take precedence over theme colors, which take
      precedence over defaults.

      Fallback order:

      1. --trees-*-override (explicit)
      2. --trees-theme-* (e.g. Shiki/VS Code tokens)
      3. defaults

      Theme variable names mirror Shiki/VS Code theme file JSON tokens.

      // Available CSS Color Overrides
      --trees-fg-override
      --trees-fg-muted-override
      --trees-bg-override
      --trees-bg-muted-override
      --trees-accent-override
      --trees-border-color-override

      --trees-focus-ring-color-override
      --trees-focus-ring-width-override
      --trees-focus-ring-offset-override

      --trees-search-fg-override
      --trees-search-font-weight-override
      --trees-search-bg-override

      --trees-selected-fg-override
      --trees-selected-bg-override
      --trees-selected-focused-border-color-override

      // Git Status Color Overrides
      --trees-status-added-override
      --trees-status-ignored-override
      --trees-status-modified-override
      --trees-status-renamed-override
      --trees-status-untracked-override
      --trees-status-deleted-override
      --trees-git-added-color-override
      --trees-git-ignored-color-override
      --trees-git-modified-color-override
      --trees-git-renamed-color-override
      --trees-git-untracked-color-override
      --trees-git-deleted-color-override

      // Built-in File Icon Color Overrides
      --trees-file-icon-color
      --trees-file-icon-color-astro
      --trees-file-icon-color-babel
      --trees-file-icon-color-bash
      --trees-file-icon-color-biome
      --trees-file-icon-color-bootstrap
      --trees-file-icon-color-browserslist
      --trees-file-icon-color-bun
      --trees-file-icon-color-c
      --trees-file-icon-color-cpp
      --trees-file-icon-color-claude
      --trees-file-icon-color-css
      --trees-file-icon-color-database
      --trees-file-icon-color-default
      --trees-file-icon-color-docker
      --trees-file-icon-color-eslint
      --trees-file-icon-color-git
      --trees-file-icon-color-go
      --trees-file-icon-color-graphql
      --trees-file-icon-color-html
      --trees-file-icon-color-image
      --trees-file-icon-color-javascript
      --trees-file-icon-color-json
      --trees-file-icon-color-markdown
      --trees-file-icon-color-mcp
      --trees-file-icon-color-npm
      --trees-file-icon-color-oxc
      --trees-file-icon-color-postcss
      --trees-file-icon-color-prettier
      --trees-file-icon-color-python
      --trees-file-icon-color-react
      --trees-file-icon-color-ruby
      --trees-file-icon-color-rust
      --trees-file-icon-color-sass
      --trees-file-icon-color-svg
      --trees-file-icon-color-svelte
      --trees-file-icon-color-svgo
      --trees-file-icon-color-swift
      --trees-file-icon-color-table
      --trees-file-icon-color-text
      --trees-file-icon-color-tailwind
      --trees-file-icon-color-terraform
      --trees-file-icon-color-typescript
      --trees-file-icon-color-vite
      --trees-file-icon-color-vscode
      --trees-file-icon-color-vue
      --trees-file-icon-color-wasm
      --trees-file-icon-color-webpack
      --trees-file-icon-color-yml
      --trees-file-icon-color-zig
      --trees-file-icon-color-zip

      // Density
      //
      // A unitless scale factor for padding, gaps, and indentation. Usually
      // set via \`density\` on useFileTree. Individual overrides take precedence.
      //
      //   Compact: 0.8
      //   Default: 1
      //   Relaxed: 1.2
      //
      --trees-density-override

      // Available CSS Layout Overrides
      --trees-gap-override
      --trees-border-radius-override
      --trees-font-family-override
      --trees-font-size-override
      --trees-font-weight-regular-override
      --trees-font-weight-semibold-override
      --trees-level-gap-override
      --trees-item-padding-x-override
      --trees-item-margin-x-override
      --trees-item-row-gap-override
      --trees-icon-width-override
      --trees-icon-nudge-override
      --trees-scrollbar-gutter-override
      --trees-padding-inline-override
    */

    --trees-accent: var(--trees-accent-override, #009fff);
    --trees-fg: var(
      --trees-fg-override,
      var(--trees-theme-sidebar-fg, light-dark(#6c6c71, #adadb1))
    );
    --trees-fg-muted: var(
      --trees-fg-muted-override,
      var(--trees-theme-sidebar-header-fg, light-dark(#84848a, #84848a))
    );
    --trees-bg: var(
      --trees-bg-override,
      var(--trees-theme-sidebar-bg, light-dark(#f8f8f8, #141415))
    );
    /* var(--trees-theme-list-hover-bg, light-dark(#dfebff59, #19283c59)) */
    --trees-bg-muted: var(
      --trees-bg-muted-override,
      var(
        --trees-theme-list-hover-bg,
        light-dark(
          color-mix(
            in lab,
            var(--trees-accent) var(--trees-bg-alpha-light, 8%),
            var(--trees-bg)
          ),
          color-mix(
            in lab,
            var(--trees-accent) var(--trees-bg-alpha-dark, 10%),
            var(--trees-bg)
          )
        )
      )
    );
    --trees-input-bg: var(
      --trees-input-bg-override,
      light-dark(#f8f8f8, #070707)
    );

    --trees-added-light: #16a994;
    --trees-added-dark: #00cab1;
    --trees-ignored-light: #adadb1;
    --trees-ignored-dark: #4a4a4e;
    --trees-modified-light: #1ca1c7;
    --trees-modified-dark: #08c0ef;
    --trees-renamed-light: #d5a910;
    --trees-renamed-dark: #ffd452;
    --trees-untracked-light: #16a994;
    --trees-untracked-dark: #00cab1;
    --trees-deleted-light: #ff2e3f;
    --trees-deleted-dark: #ff6762;

    --trees-border-color: var(
      --trees-border-color-override,
      var(--trees-theme-sidebar-border, light-dark(#eeeeef, #070707))
    );
    --trees-indent-guide-bg: var(
      --trees-indent-guide-bg-override,
      color-mix(in lab, var(--trees-fg-muted) 25%, transparent)
    );
    --trees-density: var(--trees-density-override, 1);
    --trees-border-radius: var(
      --trees-border-radius-override,
      calc(6px * var(--trees-density))
    );

    --trees-font-family: var(--trees-font-family-override, system-ui);
    --trees-font-size: var(--trees-font-size-override, 13px);
    --trees-font-weight-regular: var(--trees-font-weight-regular-override, 400);
    --trees-font-weight-semibold: var(
      --trees-font-weight-semibold-override,
      600
    );

    --trees-focus-ring-color: var(
      --trees-focus-ring-color-override,
      var(--trees-theme-focus-ring, var(--trees-accent))
    );
    --trees-focus-ring-width: var(--trees-focus-ring-width-override, 1px);
    --trees-focus-ring-offset: var(--trees-focus-ring-offset-override, -1px);

    --trees-search-fg: var(
      --trees-search-fg-override,
      var(--trees-theme-input-fg, var(--trees-fg))
    );
    --trees-search-font-weight: var(--trees-search-font-weight-override, 600);
    --trees-search-bg: var(
      --trees-search-bg-override,
      var(--trees-theme-input-bg, var(--trees-input-bg))
    );

    --trees-scrollbar-thumb: var(
      --trees-scrollbar-thumb-override,
      var(
        --trees-theme-scrollbar-thumb,
        color-mix(in lab, var(--trees-fg) 25%, var(--trees-bg))
      )
    );

    --trees-selected-fg: var(
      --trees-selected-fg-override,
      var(--trees-theme-list-active-selection-fg, var(--trees-fg))
    );
    --trees-selected-bg: var(
      --trees-selected-bg-override,
      var(
        --trees-theme-list-active-selection-bg,
        light-dark(
          color-mix(in lab, var(--trees-accent) 12%, var(--trees-bg)),
          color-mix(in lab, var(--trees-accent) 15%, var(--trees-bg))
        )
      )
    );
    --trees-selected-focused-border-color: var(
      --trees-selected-focused-border-color-override,
      var(--trees-theme-focus-ring, var(--trees-accent))
    );

    /* Git status (e.g. from Shiki theme gitDecoration.*) */
    --trees-status-added: var(
      --trees-status-added-override,
      var(
        --trees-theme-git-added-fg,
        light-dark(var(--trees-added-light), var(--trees-added-dark))
      )
    );
    --trees-status-ignored: var(
      --trees-status-ignored-override,
      var(
        --trees-theme-git-ignored-fg,
        light-dark(var(--trees-ignored-light), var(--trees-ignored-dark))
      )
    );
    --trees-status-modified: var(
      --trees-status-modified-override,
      var(
        --trees-theme-git-modified-fg,
        light-dark(var(--trees-modified-light), var(--trees-modified-dark))
      )
    );
    --trees-status-renamed: var(
      --trees-status-renamed-override,
      var(
        --trees-theme-git-renamed-fg,
        light-dark(var(--trees-renamed-light), var(--trees-renamed-dark))
      )
    );
    --trees-status-untracked: var(
      --trees-status-untracked-override,
      var(
        --trees-theme-git-untracked-fg,
        light-dark(var(--trees-untracked-light), var(--trees-untracked-dark))
      )
    );
    --trees-status-deleted: var(
      --trees-status-deleted-override,
      var(
        --trees-theme-git-deleted-fg,
        light-dark(var(--trees-deleted-light), var(--trees-deleted-dark))
      )
    );
    --trees-git-modified-color: var(
      --trees-git-modified-color-override,
      var(--trees-status-modified)
    );
    --trees-git-added-color: var(
      --trees-git-added-color-override,
      var(--trees-status-added)
    );
    --trees-git-ignored-color: var(
      --trees-git-ignored-color-override,
      var(--trees-status-ignored)
    );
    --trees-git-deleted-color: var(
      --trees-git-deleted-color-override,
      var(--trees-status-deleted)
    );
    --trees-git-renamed-color: var(
      --trees-git-renamed-color-override,
      var(--trees-status-renamed)
    );
    --trees-git-untracked-color: var(
      --trees-git-untracked-color-override,
      var(--trees-status-untracked)
    );

    --trees-icon-gray: light-dark(#84848a, #adadb1);
    --trees-icon-red: light-dark(#d52c36, #ff6762);
    --trees-icon-vermilion: light-dark(#ff8c5b, #d5512f);
    --trees-icon-orange: light-dark(#d47628, #ffa359);
    --trees-icon-yellow: light-dark(#d5a910, #ffd452);
    --trees-icon-green: light-dark(#199f43, #5ecc71);
    --trees-icon-teal: light-dark(#17a5af, #64d1db);
    --trees-icon-cyan: light-dark(#1ca1c7, #68cdf2);
    --trees-icon-blue: light-dark(#1a85d4, #69b1ff);
    --trees-icon-indigo: light-dark(#693acf, #9d6afb);
    --trees-icon-purple: light-dark(#a631be, #d568ea);
    --trees-icon-pink: light-dark(#d32a61, #ff678d);
    --trees-icon-mauve: light-dark(#594c5b, #79697b);

    --trees-file-icon-color-default: var(
      --trees-file-icon-color,
      var(--trees-icon-gray)
    );
    --trees-file-icon-color-astro: var(
      --trees-file-icon-color,
      var(--trees-icon-purple)
    );
    --trees-file-icon-color-babel: var(
      --trees-file-icon-color,
      var(--trees-icon-yellow)
    );
    --trees-file-icon-color-bash: var(
      --trees-file-icon-color,
      var(--trees-icon-green)
    );
    --trees-file-icon-color-biome: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-bootstrap: var(
      --trees-file-icon-color,
      var(--trees-icon-indigo)
    );
    --trees-file-icon-color-browserslist: var(
      --trees-file-icon-color,
      var(--trees-icon-yellow)
    );
    --trees-file-icon-color-bun: var(
      --trees-file-icon-color,
      var(--trees-icon-mauve)
    );
    --trees-file-icon-color-c: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-cpp: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-claude: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-css: var(
      --trees-file-icon-color,
      var(--trees-icon-indigo)
    );
    --trees-file-icon-color-database: var(
      --trees-file-icon-color,
      var(--trees-icon-purple)
    );
    --trees-file-icon-color-docker: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-eslint: var(
      --trees-file-icon-color,
      var(--trees-icon-indigo)
    );
    --trees-file-icon-color-git: var(
      --trees-file-icon-vermilion,
      var(--trees-icon-vermilion)
    );
    --trees-file-icon-color-go: var(
      --trees-file-icon-color,
      var(--trees-icon-cyan)
    );
    --trees-file-icon-color-graphql: var(
      --trees-file-icon-color,
      var(--trees-icon-pink)
    );
    --trees-file-icon-color-html: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-image: var(
      --trees-file-icon-color,
      var(--trees-icon-pink)
    );
    --trees-file-icon-color-javascript: var(
      --trees-file-icon-color,
      var(--trees-icon-yellow)
    );
    --trees-file-icon-color-json: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-markdown: var(
      --trees-file-icon-color,
      var(--trees-icon-green)
    );
    --trees-file-icon-color-mcp: var(
      --trees-file-icon-color,
      var(--trees-icon-teal)
    );
    --trees-file-icon-color-npm: var(
      --trees-file-icon-color,
      var(--trees-icon-red)
    );
    --trees-file-icon-color-oxc: var(
      --trees-file-icon-cyan,
      var(--trees-icon-cyan)
    );
    --trees-file-icon-color-postcss: var(
      --trees-file-icon-color,
      var(--trees-icon-red)
    );
    --trees-file-icon-color-prettier: var(
      --trees-file-icon-color,
      var(--trees-icon-teal)
    );
    --trees-file-icon-color-python: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-react: var(
      --trees-file-icon-color,
      var(--trees-icon-cyan)
    );
    --trees-file-icon-color-ruby: var(
      --trees-file-icon-color,
      var(--trees-icon-red)
    );
    --trees-file-icon-color-rust: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-sass: var(
      --trees-file-icon-color,
      var(--trees-icon-pink)
    );
    --trees-file-icon-color-svg: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-svelte: var(
      --trees-file-icon-color,
      var(--trees-icon-red)
    );
    --trees-file-icon-color-svgo: var(
      --trees-file-icon-color,
      var(--trees-icon-green)
    );
    --trees-file-icon-color-swift: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-table: var(
      --trees-file-icon-color,
      var(--trees-icon-teal)
    );
    --trees-file-icon-color-text: var(
      --trees-file-icon-color,
      var(--trees-icon-gray)
    );
    --trees-file-icon-color-tailwind: var(
      --trees-file-icon-color,
      var(--trees-icon-cyan)
    );
    --trees-file-icon-color-terraform: var(
      --trees-file-icon-color,
      var(--trees-icon-indigo)
    );
    --trees-file-icon-color-typescript: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-vite: var(
      --trees-file-icon-color,
      var(--trees-icon-purple)
    );
    --trees-file-icon-color-vscode: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-vue: var(
      --trees-file-icon-color,
      var(--trees-icon-green)
    );
    --trees-file-icon-color-wasm: var(
      --trees-file-icon-color,
      var(--trees-icon-indigo)
    );
    --trees-file-icon-color-webpack: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-yml: var(
      --trees-file-icon-color,
      var(--trees-icon-red)
    );
    --trees-file-icon-color-zig: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-zip: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );

    --trees-level-gap: var(
      --trees-level-gap-override,
      calc(8px * var(--trees-density))
    );
    --trees-item-padding-x: var(
      --trees-item-padding-x-override,
      calc(8px * var(--trees-density))
    );
    --trees-item-margin-x: var(
      --trees-item-margin-x-override,
      calc(2px * var(--trees-density))
    );
    --trees-item-row-gap: var(
      --trees-item-row-gap-override,
      calc(6px * var(--trees-density))
    );
    --trees-icon-width: var(--trees-icon-width-override, 16px);
    --trees-icon-nudge: var(
      --trees-icon-nudge-override,
      calc(1px * var(--trees-density))
    );
    --trees-row-height: var(--trees-item-height, 30px);
    --trees-git-lane-width: var(--trees-git-lane-width-override, 12px);
    --trees-action-lane-width: var(
      --trees-action-lane-width-override,
      calc(var(--trees-icon-width) + 2px)
    );
    /* Keep the floating trigger aligned with the row's action lane. Going in
       from the root's right edge: the scroll container reserves
       \`--trees-padding-inline\` of effective inset on each side (its asymmetric
       padding formula cancels the scrollbar gutter on the right), the row
       sits inside that inset, and its trailing \`--trees-item-padding-x\` is the
       action lane itself. The trigger's own focus-ring margin then trims one
       pixel back so the button's visible right edge lines up with the lane. */
    --trees-context-menu-trigger-inline-offset: calc(
      var(--trees-padding-inline) + var(--trees-item-padding-x) -
        var(--trees-focus-ring-width)
    );

    --trees-scrollbar-gutter: var(--trees-scrollbar-gutter-override, 6px);
    --trees-padding-inline: var(--trees-padding-inline-override, 16px);

    color-scheme: light dark;
    display: flex;
    flex-direction: column;
    font-size: var(--trees-font-size);
    color: var(--trees-fg);
    background-color: var(--trees-bg);
    --truncate-marker-background-color: var(--trees-bg);
    --truncate-marker-background-overlay-color: transparent;
    font-family: var(--trees-font-family);
    font-weight: var(--trees-font-weight-regular);
  }

  :host([data-file-tree-virtualized='true']) {
    height: 100%;
    overflow: hidden;
  }

  [data-file-tree-virtualized-wrapper='true'] {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  [data-file-tree-virtualized-root='true'] {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  [data-file-tree-virtualized-scroll='true'],
  [data-file-tree-scrollbar-measure='true'] {
    --trees-scrollbar-thumb-current: transparent;
    overflow-y: auto;
    scrollbar-gutter: stable;

    &:hover {
      --trees-scrollbar-thumb-current: var(--trees-scrollbar-thumb);
    }

    &::-webkit-scrollbar {
      width: var(--trees-scrollbar-gutter);
      height: var(--trees-scrollbar-gutter);
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--trees-scrollbar-thumb-current);
      border: 1px solid transparent;
      background-clip: content-box;
      border-radius: calc(var(--trees-scrollbar-gutter) / 2);
    }

    &::-webkit-scrollbar-corner {
      background-color: transparent;
    }
  }

  /* These are styles for a temporarily generated element to measure the size
   * of the scrollbar.  It's intended to be somewhat similar in scrollbar style
   * scope to the scrollable tree so \`--trees-scrollbar-gutter-measured\` is an
   * accurate reflection of the size the scrollbar gutter takes up. */
  [data-file-tree-scrollbar-measure='true'] {
    position: absolute;
    top: 0;
    left: 0;
    visibility: hidden;
    pointer-events: none;
    width: 100px;
    height: 100px;
  }

  @supports (-moz-appearance: none) {
    [data-file-tree-virtualized-scroll='true'],
    [data-file-tree-scrollbar-measure='true'] {
      scrollbar-width: thin;
      scrollbar-color: var(--trees-scrollbar-thumb-current) transparent;
    }
  }

  [data-file-tree-virtualized-scroll='true'] {
    position: relative;
    overflow-y: auto;
    flex: 1 1 0;
    min-height: 0;
    padding-inline: max(
        calc(var(--trees-padding-inline) - var(--trees-item-margin-x)),
        0px
      )
      /* NOTE(amadeus): We can assume that all Webkit based browser gutters
       * will align to the value of '--trees-scrollbar-gutter', however if not, then
       * \`--trees-scrollbar-gutter-measured\` should correct it. Mostly we are
       * hoping to avoid SSR alignment jumps if possible. In non-SSR'd environments
       * \`--trees-scrollbar-gutter-measured\` should always be immediately available.
       */
      max(
        calc(
          var(--trees-padding-inline) - var(--trees-item-margin-x) -
            var(
              --trees-scrollbar-gutter-measured,
              var(--trees-scrollbar-gutter)
            )
        ),
        0px
      );
  }

  @supports (-moz-appearance: none) {
    [data-file-tree-virtualized-scroll='true'] {
      padding-inline: max(
          calc(var(--trees-padding-inline) - var(--trees-item-margin-x)),
          0px
        )
        /* NOTE(amadeus): However on Firefox it can vary a little bit, but most
         * likely the majority of cases will default to a 0px width scrollbar lets
         * inherit that first to avoid SSR jumps. In non-SSR'd environments
         * \`--trees-scrollbar-gutter-measured\` should always be immediately available.
         */
        max(
          calc(
            var(--trees-padding-inline) - var(--trees-item-margin-x) -
              var(--trees-scrollbar-gutter-measured, 0px)
          ),
          0px
        );
    }
  }

  [data-file-tree-sticky-overlay='true'] {
    position: sticky;
    top: 0;
    height: 0;
    z-index: 4;
    overflow: visible;
    pointer-events: none;
  }

  /* The overlay DOM is kept populated even at scrollTop=0 so the browser has
   * the rendered rows on hand the moment scrolling begins — otherwise the
   * compositor paints a scrolled frame before React can mount the overlay,
   * and the topmost sticky folder jumps up by a couple of pixels before it
   * "snaps" into its pinned position. We hide it via CSS whenever the scroll
   * is at the top and no scroll is in progress, so the preview doesn't leak
   * through at rest. \`data-overlay-reveal\` is stamped on the root only when
   * the user initiates a scroll while already at the top — exactly the case
   * where we need the pre-mounted overlay to be visible through the first
   * compositor frame. It is deliberately distinct from the general
   * \`data-is-scrolling\` flag so a scroll that ends at the top (e.g. ArrowUp
   * navigation) re-hides the overlay the instant the scroll lands, rather
   * than waiting for the hover-suppression timer to elapse. */
  [data-file-tree-virtualized-root='true'][data-scroll-at-top='true']:not(
      [data-overlay-reveal]
    )
    [data-file-tree-sticky-overlay='true'] {
    visibility: hidden;
  }

  [data-file-tree-sticky-overlay-content='true'] {
    background-color: var(--trees-bg);
    position: relative;
    pointer-events: none;
  }

  [data-file-tree-virtualized-list='true'] {
    background-color: var(--trees-bg);
    position: relative;
    min-height: 100%;
    width: 100%;
    overflow-anchor: none;

    &[data-is-scrolling] {
      pointer-events: none;
    }
  }

  [data-file-tree-virtualized-sticky-offset='true'] {
    contain: layout size;
  }

  [data-file-tree-virtualized-sticky='true'] {
    position: sticky;
    top: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    isolation: isolate;
    /* Promote to its own compositor layer so text inside the window is
     * rasterized once and GPU-translated during scroll. Without this, the
     * browser re-paints the window (and its text) at every scroll frame,
     * which produces visible 1px shake / character tearing. */
    will-change: transform;
  }

  [data-file-tree-search-container] {
    display: flex;
    padding: 0;
    padding-inline: var(--trees-padding-inline);
    margin-bottom: var(--trees-item-row-gap);
  }

  [data-file-tree-search-input] {
    --trees-focus-ring-width: 2px;
    font-family: var(--trees-font-family);
    font-size: var(--trees-font-size);
    flex: 1;
    height: var(--trees-row-height);
    /* 1px breathing room so the focus-visible outline isn't clipped when the
     * input sits flush against the top of the scroll container. */
    margin-block: 1px;
    padding-inline: var(--trees-item-padding-x);
    line-height: var(--trees-row-height);
    color: var(--trees-search-fg);
    background-color: var(--trees-search-bg);
    border: 1px solid var(--trees-border-color);
    border-radius: var(--trees-border-radius);
    outline: none;

    &::placeholder {
      color: color-mix(
        in lab,
        var(--trees-search-fg) 65%,
        var(--trees-search-bg)
      );
    }

    &:focus-visible,
    &[data-file-tree-search-input-fake-focus='true'] {
      outline: var(--trees-focus-ring-width) solid var(--trees-focus-ring-color);
      outline-offset: var(--trees-focus-ring-offset);
    }
  }

  /* The wrapper for the tree items */
  [role='tree'] {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--trees-gap-override, 0);
  }

  /* LIST ITEM */
  [data-type='item'] {
    color: inherit;
    font-family: var(--trees-font-family);
    font-size: var(--trees-font-size);
    text-align: start;
    outline: none;
    background-color: var(--trees-bg);
    border: none;
    position: relative;

    padding: 0 var(--trees-item-padding-x);
    margin: 0 var(--trees-item-margin-x);
    cursor: pointer;
    -webkit-user-select: none;
            user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;
    display: flex;
    flex: 0 0 var(--trees-row-height);
    align-items: center;
    height: var(--trees-row-height);
    line-height: var(--trees-row-height);
    gap: var(--trees-item-row-gap);
    border-radius: var(--trees-border-radius);
    /* Row states may be translucent, so markers paint the tree background first
     * and then the state color on top to avoid compositing the same alpha twice. */
    --truncate-marker-background-color: var(--trees-bg);
    --truncate-marker-background-overlay-color: transparent;
    --truncate-marker-block-inset: 0px;

    &:hover,
    &[data-item-context-hover='true'] {
      background-color: var(--trees-bg-muted);
      --truncate-marker-background-overlay-color: var(--trees-bg-muted);
    }

    &[data-item-focused='true'],
    &:focus-visible {
      z-index: 2;

      /* Flattened segment markers sit high enough to cover the row outline unless
       * their painted background is inset by the focus ring width. */
      [data-item-flattened-subitems] {
        --truncate-marker-block-inset: var(--trees-focus-ring-width);
      }

      &::before {
        position: absolute;
        inset: 0;
        content: '';
        display: block;
        border-radius: var(--trees-border-radius);
        outline: var(--trees-focus-ring-width) solid
          var(--trees-focus-ring-color);
        outline-offset: var(--trees-focus-ring-offset);
        pointer-events: none;
      }

      &[data-item-selected='true']::before {
        outline-color: var(--trees-selected-focused-border-color);
      }
    }

    &[data-item-selected='true'] {
      color: var(--trees-selected-fg);
      background-color: var(--trees-selected-bg);
      --truncate-marker-background-overlay-color: var(--trees-selected-bg);
      z-index: 3;

      [data-item-section='icon'] {
        color: var(--trees-selected-fg);
      }
    }

    &[data-item-search-match='true'] {
      font-weight: var(--trees-search-font-weight);
    }
  }

  [data-type='item'][data-file-tree-sticky-row='true'] {
    pointer-events: auto;
  }

  /* Sticky rows opt back into pointer events because the overlay wrapper is
   * inert. During scroll, put them back under the same hover suppression as
   * the virtualized list so translucent hover states and menu triggers do not
   * paint over rows moving beneath the sticky stack. */
  [data-file-tree-virtualized-root='true'][data-is-scrolling]
    [data-type='item'][data-file-tree-sticky-row='true'] {
    pointer-events: none;
  }

  [data-file-tree-virtualized-root='true'][data-is-scrolling]
    [data-type='item'][data-file-tree-sticky-row='true']:hover:not(
      [data-item-selected='true']
    ),
  [data-file-tree-virtualized-root='true'][data-is-scrolling]
    [data-type='item'][data-file-tree-sticky-row='true'][data-item-context-hover='true']:not(
      [data-item-selected='true']
    ) {
    background-color: var(--trees-bg);
    --truncate-marker-background-overlay-color: transparent;
  }

  [data-item-selected='true']:has(+ [data-item-selected='true']) {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  [data-item-selected='true'] + [data-item-selected='true'] {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  /* Flattened Directory Parts */
  [data-item-flattened-subitems] {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  [data-item-flattened-subitem]:hover,
  [data-item-flattened-subitem-drag-target='true'] {
    text-decoration: underline;
  }

  /* Icon for each item */
  [data-item-section='icon'] {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--trees-fg-muted);
    fill: currentColor;
    width: var(--trees-icon-width);
  }

  :where([data-item-section='icon'] > [data-icon-token]) {
    color: var(--trees-fg-muted);
  }

  [data-file-tree-colored-icons='true'] {
    [data-icon-token='astro'] {
      color: var(--trees-file-icon-color-astro);
    }
    [data-icon-token='babel'] {
      color: var(--trees-file-icon-color-babel);
    }
    [data-icon-token='bash'] {
      color: var(--trees-file-icon-color-bash);
    }
    [data-icon-token='biome'] {
      color: var(--trees-file-icon-color-biome);
    }
    [data-icon-token='bootstrap'] {
      color: var(--trees-file-icon-color-bootstrap);
    }
    [data-icon-token='browserslist'] {
      color: var(--trees-file-icon-color-browserslist);
    }
    [data-icon-token='bun'] {
      color: var(--trees-file-icon-color-bun);
    }
    [data-icon-token='c'] {
      color: var(--trees-file-icon-color-c);
    }
    [data-icon-token='cpp'] {
      color: var(--trees-file-icon-color-cpp);
    }
    [data-icon-token='claude'] {
      color: var(--trees-file-icon-color-claude);
    }
    [data-icon-token='css'] {
      color: var(--trees-file-icon-color-css);
    }
    [data-icon-token='database'] {
      color: var(--trees-file-icon-color-database);
    }
    [data-icon-token='default'] {
      color: var(--trees-file-icon-color-default);
    }
    [data-icon-token='docker'] {
      color: var(--trees-file-icon-color-docker);
    }
    [data-icon-token='eslint'] {
      color: var(--trees-file-icon-color-eslint);
    }
    [data-icon-token='git'] {
      color: var(--trees-file-icon-color-git);
    }
    [data-icon-token='go'] {
      color: var(--trees-file-icon-color-go);
    }
    [data-icon-token='graphql'] {
      color: var(--trees-file-icon-color-graphql);
    }
    [data-icon-token='html'] {
      color: var(--trees-file-icon-color-html);
    }
    [data-icon-token='image'] {
      color: var(--trees-file-icon-color-image);
    }
    [data-icon-token='javascript'] {
      color: var(--trees-file-icon-color-javascript);
    }
    [data-icon-token='json'] {
      color: var(--trees-file-icon-color-json);
    }
    [data-icon-token='markdown'] {
      color: var(--trees-file-icon-color-markdown);
    }
    [data-icon-token='mcp'] {
      color: var(--trees-file-icon-color-mcp);
    }
    [data-icon-token='npm'] {
      color: var(--trees-file-icon-color-npm);
    }
    [data-icon-token='oxc'] {
      color: var(--trees-file-icon-color-oxc);
    }
    [data-icon-token='postcss'] {
      color: var(--trees-file-icon-color-postcss);
    }
    [data-icon-token='prettier'] {
      color: var(--trees-file-icon-color-prettier);
    }
    [data-icon-token='python'] {
      color: var(--trees-file-icon-color-python);
    }
    [data-icon-token='react'] {
      color: var(--trees-file-icon-color-react);
    }
    [data-icon-token='ruby'] {
      color: var(--trees-file-icon-color-ruby);
    }
    [data-icon-token='rust'] {
      color: var(--trees-file-icon-color-rust);
    }
    [data-icon-token='sass'] {
      color: var(--trees-file-icon-color-sass);
    }
    [data-icon-token='svg'] {
      color: var(--trees-file-icon-color-svg);
    }
    [data-icon-token='svelte'] {
      color: var(--trees-file-icon-color-svelte);
    }
    [data-icon-token='svgo'] {
      color: var(--trees-file-icon-color-svgo);
    }
    [data-icon-token='swift'] {
      color: var(--trees-file-icon-color-swift);
    }
    [data-icon-token='table'] {
      color: var(--trees-file-icon-color-table);
    }
    [data-icon-token='text'] {
      color: var(--trees-file-icon-color-text);
    }
    [data-icon-token='tailwind'] {
      color: var(--trees-file-icon-color-tailwind);
    }
    [data-icon-token='terraform'] {
      color: var(--trees-file-icon-color-terraform);
    }
    [data-icon-token='typescript'] {
      color: var(--trees-file-icon-color-typescript);
    }
    [data-icon-token='vite'] {
      color: var(--trees-file-icon-color-vite);
    }
    [data-icon-token='vscode'] {
      color: var(--trees-file-icon-color-vscode);
    }
    [data-icon-token='vue'] {
      color: var(--trees-file-icon-color-vue);
    }
    [data-icon-token='wasm'] {
      color: var(--trees-file-icon-color-wasm);
    }
    [data-icon-token='webpack'] {
      color: var(--trees-file-icon-color-webpack);
    }
    [data-icon-token='yml'] {
      color: var(--trees-file-icon-color-yml);
    }
    [data-icon-token='zig'] {
      color: var(--trees-file-icon-color-zig);
    }
    [data-icon-token='zip'] {
      color: var(--trees-file-icon-color-zip);
    }
  }

  /* Chevron rotation and visual alignment */
  /* Chevron pointing down */
  [data-icon-name='file-tree-icon-chevron'] {
    &[data-align-capitals='false'] {
      transform: translate(0, var(--trees-icon-nudge));
    }
    &[data-align-capitals='true'] {
      transform: translate(0, 0);
    }
  }

  [data-item-section='content'] {
    flex: 0 1 auto;
    text-align: start;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    /* Breaks middle truncate component to also set this */
    /* white-space: nowrap; */
  }

  [data-item-section='decoration'] {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    justify-content: flex-end;
    text-align: end;
    overflow: hidden;
    color: var(--trees-fg-muted);
  }

  [data-item-section='decoration'] > span {
    min-width: 0;
    max-width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-item-section='git'],
  [data-item-section='action'] {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  [data-item-section='git'] {
    width: var(--trees-git-lane-width);
  }

  [data-item-section='action'] {
    width: var(--trees-action-lane-width);
    color: var(--trees-fg-muted);
    fill: currentColor;
    pointer-events: none;
  }

  [data-item-section='git'] > span,
  [data-item-section='action'] > span {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  [data-item-action-affordance='decorative'] {
    opacity: 0.85;
  }

  [data-item-rename-input] {
    appearance: none;
    width: 100%;
    min-width: 0;
    height: calc(var(--trees-row-height) - 4px);
    font-family: inherit;
    font-size: inherit;
    /* line-height: calc(var(--trees-row-height) - 8px); */
    color: inherit;
    background-color: transparent;
    border: 0;
    padding-inline: 6px;
    outline: none;
    box-sizing: border-box;
  }

  [data-item-section='content']:has([data-item-rename-input])
    ~ [data-item-section='action'],
  [data-item-section='content']:has([data-item-rename-input])
    ~ [data-item-section='decoration'] {
    display: none;
  }

  /* Chevron pointing right */
  [aria-expanded='false'][data-item-type='folder']
    > [data-item-section='icon']
    > [data-icon-name='file-tree-icon-chevron'] {
    &[data-align-capitals='true'] {
      transform: rotate(-90deg)
        translate(
          calc(var(--trees-icon-nudge) / 2),
          calc(var(--trees-icon-nudge) / 2)
        );
    }
    &[data-align-capitals='false'] {
      transform: rotate(-90deg)
        translate(
          calc(var(--trees-icon-nudge) / 2 * -1),
          calc(var(--trees-icon-nudge) / 2)
        );
    }
  }

  /* LIST IDENTATION */
  /* Spacing container */
  [data-item-section='spacing'] {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: var(--trees-row-height);
    padding-left: calc(calc(var(--trees-icon-width) / 2) - 0.5px);

    &:empty {
      padding-left: 0;
    }
  }

  /* Spacing per level */
  [data-item-section='spacing-item'] {
    transform: translateX(-0.25px);
    display: inline-block;
    border-left: 1px solid var(--trees-indent-guide-bg);
    height: 100%;
    margin-right: calc(var(--trees-level-gap) - 1px);
    opacity: 0;
    transition: opacity 150ms ease;

    & + & {
      margin-left: calc(
        var(--trees-item-row-gap) + calc(var(--trees-icon-width) / 2) - 0.5px
      );
    }
  }

  :host(:hover) [data-item-section='spacing-item'] {
    opacity: 0.75;
  }

  /* Git status indicator */

  /* This is a folder that contains a git change */
  [data-item-contains-git-change='true'] > [data-item-section='git'] {
    color: var(--trees-git-modified-color);
    opacity: 0.5;
    fill: currentColor;
  }

  /* These are files that have a git change */
  [data-item-git-status] {
    &
      > :where([data-item-section='icon'])
      > :where(:not([data-icon-name='file-tree-icon-chevron'])) {
      color: var(--trees-item-git-status-color);
    }
    & > [data-item-section='content'] {
      color: var(--trees-item-git-status-color);
    }
    & > [data-item-section='git'] {
      color: var(--trees-item-git-status-color);
      font-weight: var(--trees-font-weight-semibold);
    }
  }

  [data-item-git-status='added'] {
    --trees-item-git-status-color: var(--trees-git-added-color);
  }

  [data-item-git-status='deleted'] {
    --trees-item-git-status-color: var(--trees-git-deleted-color);
  }

  [data-item-git-status='ignored'] {
    --trees-item-git-status-color: var(--trees-git-ignored-color);

    & > [data-item-section='icon'] {
      opacity: 0.5;
    }
  }

  [data-item-section='git'] [data-icon-name='file-tree-icon-dot'] {
    /* this is a nudge to align the dot with the likely lowercase text. it's slightly
    generalizable, but other fonts are gonna need other nudges i assume */
    transform: translateY(calc(0.65ex - 50%));
  }

  [data-item-git-status='modified'] {
    --trees-item-git-status-color: var(--trees-git-modified-color);
  }

  [data-item-git-status='renamed'] {
    --trees-item-git-status-color: var(--trees-git-renamed-color);
  }

  [data-item-git-status='untracked'] {
    --trees-item-git-status-color: var(--trees-git-untracked-color);
  }

  /* Drag and drop */
  [data-item-drag-target='true'] {
    background-color: var(--trees-selected-bg);
  }

  [data-item-dragging='true'] {
    opacity: 0.5;
  }

  /* Lock icon for locked paths (sibling of content) */
  [data-item-section='lock'] {
    flex: 0 0 auto;
    margin-left: auto;
    display: flex;
    align-items: center;
    color: var(--trees-fg-muted);
  }
  [data-item-section='lock'] svg {
    display: block;
  }

  [data-type='header-slot'] {
    display: block;
    flex: 0 0 auto;
  }

  [data-type='context-menu-wash'] {
    position: absolute;
    inset: 0;
    z-index: 3;
    background-color: transparent;
    touch-action: none;
  }

  [data-type='context-menu-anchor'] {
    position: absolute;
    top: 0;
    right: var(--trees-context-menu-trigger-inline-offset);
    z-index: 4;
    display: none;
    align-items: center;

    &[data-visible='true'] {
      display: flex;
    }
  }

  /* Hide the floating trigger while the scroll container is actively moving.
   * The anchor is positioned against the root, not the scroll content, so its
   * \`top\` follows the row via a React state update — one frame behind the
   * compositor. That delay is visible as the trigger hovering over the wrong
   * row during the first frame of a scroll. The \`data-is-scrolling\` flag on
   * the root is flipped synchronously on \`wheel\`/\`touchmove\`/\`keydown\` before
   * the compositor commits the next paint, so this selector hides the anchor
   * in the same frame the scroll begins. */
  [data-file-tree-virtualized-root='true'][data-is-scrolling]
    [data-type='context-menu-anchor'] {
    display: none;
  }

  [data-type='context-menu-anchor'] > slot[name='context-menu'] {
    display: block;
    width: 0;
    min-width: 0;
    flex: 0 0 0;
    overflow: visible;
  }

  /* Single floating context menu trigger */
  [data-type='context-menu-trigger'] {
    all: unset;
    align-items: center;
    justify-content: center;
    width: var(--trees-action-lane-width);
    color: var(--trees-fg-muted);
    fill: currentColor;
    cursor: pointer;
    font-family: var(--trees-font-family);
    font-size: var(--trees-font-size);
    border-top-right-radius: var(--trees-border-radius);
    border-bottom-right-radius: var(--trees-border-radius);
    margin: var(--trees-focus-ring-width);
    height: calc(var(--trees-row-height) - var(--trees-focus-ring-width) * 2);
    border-width: 0;
    transition: color 120ms ease;

    display: flex;
  }

  [data-type='context-menu-trigger']:hover,
  [data-type='context-menu-trigger'][aria-expanded='true'] {
    color: var(--trees-fg);
  }

  /** @pierre/truncate css here, manually copy pasted for now */
  [data-truncate-container] {
    /* CUSTOM TO TREES, TO SUPPORT THE OUTLINE */
    margin-top: -1px;
    margin-bottom: -1px;

    /* Width of the fade from default marker to text */
    --truncate-internal-marker-fade-width: var(
      --truncate-marker-fade-width,
      2px
    );
    /* Width of the solid color between the fade from the default marker to the text */
    --truncate-internal-marker-gap: var(--truncate-marker-gap, 0px);
    /* Opacity of the marker 'color' property, not of the element itself */
    --truncate-internal-marker-opacity: var(--truncate-marker-opacity, 50%);
    /* Opacity of the marker 'color' property specifically for the middle truncate, not opacity of the element itself */
    --truncate-internal-middle-marker-opacity: var(
      --truncate-middle-marker-opacity,
      80%
    );
    /* Background color of the default marker */
    --truncate-internal-marker-background-color: var(
      --truncate-marker-background-color,
      light-dark(white, black)
    );
    --truncate-internal-marker-background-overlay-color: var(
      --truncate-marker-background-overlay-color,
      transparent
    );
    --truncate-internal-marker-block-inset: var(
      --truncate-marker-block-inset,
      0px
    );
    /* Duration of the fade out animation for the marker */
    --truncate-internal-marker-fade-out-duration: var(
      --truncate-marker-fade-out-duration,
      0ms
    );
    /* Duration of the fade in animation for the marker */
    --truncate-internal-marker-fade-in-duration: var(
      --truncate-marker-fade-in-duration,
      100ms
    );

    /* FADE Variant specifics */
    --truncate-internal-fade-marker-color: var(
      --truncate-fade-marker-color,
      #000
    );
    --truncate-internal-fade-marker-width: var(
      --truncate-fade-marker-width,
      0.2lh
    );

    /*
    In some special cases people might be adding spacing in other ways
    that would benefit from being able to override this, however the container
    query below can't use this and would need to be redeclared with the overridden
    value. It's a bad time, but better than nothing.
    */
    --truncate-internal-single-line-height: 1lh;

    height: var(--truncate-internal-single-line-height);
    min-width: 0;
    overflow: hidden;
  }

  [data-truncate-marker] {
    display: flex;
    position: absolute;
    height: var(--truncate-internal-single-line-height);
    padding-block: var(--truncate-internal-marker-block-inset);
    box-sizing: border-box;
    align-items: center;
    background-clip: content-box;
    z-index: 2;
    color: color-mix(
      in srgb,
      currentColor var(--truncate-internal-marker-opacity),
      transparent
    );

    /* Core trick for hiding the marker until overflow occurs */
    opacity: 0;
    transition: opacity var(--truncate-internal-marker-fade-out-duration)
      ease-in-out;
  }

  @container measure (height > 1lh) {
    [data-truncate-marker] {
      opacity: 1;
      transition: opacity var(--truncate-internal-marker-fade-in-duration)
        ease-in-out;
    }
  }

  [data-truncate-grid] {
    display: grid;
    position: relative;
  }

  [data-truncate-content='visible'] {
    white-space: nowrap;
  }

  [data-truncate-content='overflow'] {
    opacity: 0;
    pointer-events: none;
    -webkit-user-select: none;
            user-select: none;
    word-break: break-all;
    margin-top: calc(-1 * var(--truncate-internal-single-line-height));
  }

  [data-truncate-marker-cell] {
    container: measure / size;
    overflow: visible;
    -webkit-user-select: none;
            user-select: none;
    pointer-events: none;
  }

  [data-truncate-container='truncate'] {
    & [data-truncate-grid] {
      grid-template-columns: minmax(0, max-content) 0;
    }
    & [data-truncate-marker] {
      right: 0;
    }
    & [data-truncate-fade] {
      margin-right: calc(-2 * var(--truncate-internal-fade-marker-width));
    }
  }

  [data-truncate-container='fruncate'] {
    & [data-truncate-grid] {
      grid-template-columns: 0 minmax(0, max-content) auto;
    }
    & [data-truncate-content] {
      direction: rtl;
    }
    & [data-truncate-content] > span {
      unicode-bidi: plaintext;
    }
    & [data-truncate-fade] {
      margin-left: calc(-2 * var(--truncate-internal-fade-marker-width));
    }
  }

  [data-truncate-variant='default'] {
    & [data-truncate-marker] {
      background-color: var(--truncate-internal-marker-background-color);
      background-image: linear-gradient(
        var(--truncate-internal-marker-background-overlay-color),
        var(--truncate-internal-marker-background-overlay-color)
      );
    }
    & [data-truncate-marker]::after,
    & [data-truncate-marker]::before {
      content: '';
      position: absolute;
      width: calc(
        var(--truncate-internal-marker-fade-width) +
          var(--truncate-internal-marker-gap)
      );
      inset-block-start: var(--truncate-internal-marker-block-inset);
      height: max(
        0px,
        calc(
          var(--truncate-internal-single-line-height) -
            var(--truncate-internal-marker-block-inset) * 2
        )
      );
      background-color: var(--truncate-internal-marker-background-color);
      background-image: linear-gradient(
        var(--truncate-internal-marker-background-overlay-color),
        var(--truncate-internal-marker-background-overlay-color)
      );
      mask-image: linear-gradient(
        var(--truncate-internal-fade-dir),
        #000 0%,
        #000 var(--truncate-internal-marker-gap),
        transparent 100%
      );
    }
    & [data-truncate-marker]::after {
      --truncate-internal-fade-dir: to right;
      right: calc(
        -1 *
          (
            var(--truncate-internal-marker-fade-width) +
              var(--truncate-internal-marker-gap)
          )
      );
    }
    & [data-truncate-marker]::before {
      --truncate-internal-fade-dir: to left;
      left: calc(
        -1 *
          (
            var(--truncate-internal-marker-fade-width) +
              var(--truncate-internal-marker-gap)
          )
      );
    }
  }

  [data-truncate-variant='fade'] {
    & [data-truncate-marker] {
      background: transparent;
    }
  }

  [data-truncate-fade] {
    box-shadow:
      0 0 calc(var(--truncate-internal-fade-marker-width) / 2)
        var(--truncate-internal-fade-marker-color),
      0 0 var(--truncate-internal-fade-marker-width)
        var(--truncate-internal-fade-marker-color);
    width: calc(var(--truncate-internal-fade-marker-width) * 2);
    height: calc(
      var(--truncate-internal-single-line-height) -
        (var(--truncate-internal-fade-marker-width) * 2)
    );
    margin: var(--truncate-internal-fade-marker-width) 0;
  }

  [data-truncate-group-container='middle'] {
    & [data-truncate-container] {
      --truncate-marker-opacity: var(--truncate-internal-middle-marker-opacity);
    }

    display: flex;
    min-width: 0;

    & > div {
      min-width: 0;
    }

    & > div[data-truncate-segment-priority='1'] {
      flex: 0 1 max-content;
    }
    & > div[data-truncate-segment-priority='2'] {
      flex: 0 999999 max-content;
    }
  }
}
`})))()}function K(e){return`${at}
@layer base {
  ${e}
}`}function it(e){return`${at}
@layer unsafe {
  ${e}
}`}var at;function ot(){return(ot=e((()=>{at=`@layer base, unsafe;`})))()}function st(e){let t=lt.get(e);if(t!=null)return t;let n=document.createElement(`div`);n.setAttribute(ze,`true`);let r=document.createElement(`div`);r.style.position=`relative`,r.style.height=`200%`,n.appendChild(r),e.appendChild(n);let i=Math.max(n.offsetWidth-n.clientWidth,0);return n.remove(),lt.set(e,i),i}function ct(e,t){if(!e.isConnected)return;let n=st(t);if(n==null)return;let r=t.querySelector(`style[${Be}]`),i=r instanceof HTMLStyleElement?r:document.createElement(`style`);r instanceof HTMLStyleElement||(i.setAttribute(Be,``),t.appendChild(i)),i.textContent=`:host { ${H}: ${n}px; }`}var lt;function ut(){return(ut=e((()=>{We(),lt=new WeakMap})))()}function dt(e){if(typeof CSSStyleSheet<`u`&&typeof CSSStyleSheet.prototype.replaceSync==`function`&&`adoptedStyleSheets`in e){pt??(pt=new CSSStyleSheet,pt.replaceSync(K(rt)));let t=!1;try{e.adoptedStyleSheets=[pt],t=!0}catch{}if(t){e.querySelector(`style[${Le}]`)?.remove();return}}if(e.querySelector(`style[data-file-tree-style]`)==null){let t=document.createElement(`style`);t.setAttribute(Le,``),t.textContent=K(rt),e.prepend(t)}}function ft(e,t){q(e,t),dt(t),ct(e,t)}function q(e,t){let n=e.querySelector(`template[shadowrootmode="open"], template[data-file-tree-shadowrootmode="open"]`);n instanceof HTMLTemplateElement&&(t.childNodes.length>0||(t.appendChild(n.content.cloneNode(!0)),n.hasAttribute(`shadowrootmode`)&&n.remove()))}var pt;function J(){return(J=e((()=>{if(We(),G(),ot(),ut(),typeof HTMLElement<`u`&&customElements.get(`file-tree-container`)==null){class e extends HTMLElement{constructor(){super()}connectedCallback(){let e=this.shadowRoot??this.attachShadow({mode:`open`});ft(this,e)}}if(customElements.define(Ie,e),typeof document<`u`)for(let e of Array.from(document.querySelectorAll(Ie)))e instanceof HTMLElement&&ft(e,e.shadowRoot??e.attachShadow({mode:`open`}))}})))()}var mt;function ht(){return(ht=e((()=>{We(),mt=e=>e.startsWith(`f::`)?e.slice(3):e})))()}function gt(e){let t=e.lastIndexOf(`/`);return t<0?{parentPath:``,baseName:e}:{parentPath:e.slice(0,t),baseName:e.slice(t+1)}}function _t(e,t){return e===``?t:`${e}/${t}`}function vt({files:e,path:t,isFolder:n,nextBasename:r}){let i=mt(t),a=r.trim();if(a.length===0)return{error:`Name cannot be empty.`};if(a.includes(`/`))return{error:`Name cannot include "/".`};let{parentPath:o,baseName:s}=gt(i);if(a===s)return{nextFiles:e,sourcePath:i,destinationPath:i,isFolder:n};let c=_t(o,a),l=Array(e.length),u=new Set;if(!n){let t=`${c}/`,r=!1;for(let n=0;n<e.length;n++){let a=e[n];if(a!==i&&a.startsWith(t))return{error:`"${c}" already exists.`};let o=a===i?c:a;if(u.has(o))return{error:`"${c}" already exists.`};u.add(o),l[n]=o,a===i&&(r=!0)}return r?{nextFiles:l,sourcePath:i,destinationPath:c,isFolder:n}:{error:`Could not find the selected file to rename.`}}let d=`${i}/`,f=`${c}/`,p=0;for(let t=0;t<e.length;t++){let n=e[t],r=n===i||n.startsWith(d);if(!r&&(n===c||n.startsWith(f)))return{error:`"${c}" already exists.`};let a=r?`${c}${n.slice(i.length)}`:n;if(u.has(a))return{error:`"${c}" already exists.`};u.add(a),l[t]=a,r&&p++}return p===0?{error:`Could not find the selected folder to rename.`}:{nextFiles:l,sourcePath:i,destinationPath:c,isFolder:n}}function yt(){return(yt=e((()=>{ht()})))()}function bt(e){return e.endsWith(`/`)}function xt(e){let t=e.endsWith(`/`)?e.slice(0,-1):e,n=t.lastIndexOf(`/`),r=n<0?t:t.slice(n+1);return e.endsWith(`/`)?`${r}/`:r}function St(e){let t=[],n=new Set;for(let r of e)n.has(r)||(n.add(r),t.push(r));let r=new Set;for(let e of t.toSorted((e,t)=>e.length===t.length?e.localeCompare(t):e.length-t.length)){let t=(e.endsWith(`/`)?e.slice(0,-1):e).split(`/`),n=!1;for(let e=0;e<t.length-1;e+=1){let i=`${t.slice(0,e+1).join(`/`)}/`;if(r.has(i)){n=!0;break}}n||r.add(e)}return t.filter(e=>r.has(e))}function Ct(e,t){return t.includes(e)?St(t):[e]}function wt(e,t){return e===t?!0:e==null||t==null?!1:e.kind===t.kind&&e.directoryPath===t.directoryPath&&e.flattenedSegmentPath===t.flattenedSegmentPath&&e.hoveredPath===t.hoveredPath}function Tt(e,t){return{draggedPaths:e,target:t}}function Et(e,t){if(t.kind!==`directory`||t.directoryPath==null)return!1;for(let n of e)if(bt(n)&&(t.directoryPath===n||t.directoryPath.startsWith(n)))return!0;return!1}function Dt(e,t){return t.kind===`root`||t.directoryPath==null?xt(e):t.directoryPath}function Ot(e,t){let n=e.map(e=>{let n=Dt(e,t);return n===e?null:{from:e,to:n,type:`move`}}).filter(e=>e!=null);return n.length===0?null:{operations:n,result:{draggedPaths:e,operation:n.length===1?`move`:`batch`,target:t}}}function kt(e,t){if(e===t)return!0;if(e.length!==t.length)return!1;for(let n=0;n<e.length;n+=1)if(e[n]!==t[n])return!1;return!0}function At(e,t,n){let{paths:r,preparedInput:i}=e;if(i==null){if(r==null)throw Error(`FileTree requires paths or preparedInput`);return{paths:r,preparedInput:void 0}}let a=i.paths;if(r==null)return{paths:a,preparedInput:i};if(!kt(ye.preparePaths(r,n==null?{}:{sort:n}),a))throw Error(`FileTree ${t} received paths and preparedInput for different path lists`);return{paths:a,preparedInput:i}}function jt(){return(jt=e((()=>{we()})))()}function Mt(e){return e.operation===`add`||e.operation===`remove`||e.operation===`move`||e.operation===`batch`}function Nt(e,t,n){if(e===t)return n;let r=t.endsWith(`/`)?t:`${t}/`;return e.startsWith(r)?`${n.endsWith(`/`)?n:`${n}/`}${e.slice(r.length)}`:e}function Pt(e,t){if(e===t)return!0;let n=t.endsWith(`/`)?t:`${t}/`;return e.startsWith(n)}function Ft(e,t,n=!1){if(e==null)return null;switch(t.operation){case`add`:case`expand`:case`collapse`:case`mark-directory-unloaded`:case`begin-child-load`:case`apply-child-patch`:case`complete-child-load`:case`fail-child-load`:case`cleanup`:return e;case`remove`:return Pt(e,t.path)?n?e:null:e;case`move`:return Nt(e,t.from,t.to);case`batch`:{let r=e;for(let e of t.events)if(r=Ft(r,e,n),r==null)return null;return r}}}function It(e){return{canonicalChanged:e.canonicalChanged,projectionChanged:e.projectionChanged,visibleCountDelta:e.visibleCountDelta}}function Lt(e){switch(e.operation){case`add`:return{...It(e),operation:`add`,path:e.path};case`remove`:return{...It(e),operation:`remove`,path:e.path,recursive:e.recursive};case`move`:return{...It(e),from:e.from,operation:`move`,to:e.to}}}function Rt(e){return{...It(e),events:e.events.filter(e=>e.operation===`add`||e.operation===`remove`||e.operation===`move`).map(e=>Lt(e)),operation:`batch`}}function zt(e){switch(e.operation){case`add`:case`remove`:case`move`:return Lt(e);case`batch`:return Rt(e);default:return null}}function Bt(e,t){if(e.size!==t.length)return!1;for(let n of t)if(!e.has(n))return!1;return!0}function Vt(e){let t=e.endsWith(`/`)?e.slice(0,-1):e;if(t.length===0)return[];let n=t.split(`/`);return n.slice(0,-1).map((e,t)=>`${n.slice(0,t+1).join(`/`)}/`)}function Ht(e){return Vt(e).at(-1)??null}function Ut(e,t){return t==null?e:e.startsWith(t)?e.slice(t.length):e}function Wt(e){return e.endsWith(`/`)}var Gt;function Kt(){return(Kt=e((()=>{Gt=e=>e.toLowerCase()})))()}function qt(e){let t=e.endsWith(`/`)?e.slice(0,-1):e,n=t.lastIndexOf(`/`);return n<0?t:t.slice(n+1)}function Jt(e){return e.endsWith(`/`)?e.slice(0,-1):e}function Yt(e,t){return t&&!e.endsWith(`/`)?`${e}/`:e}var Xt;function Zt(){return(Zt=e((()=>{Xt=e=>{let t=e.trim();return t.length===0?``:(t.includes(`\\`)?t.replaceAll(`\\`,`/`):t).toLowerCase()}})))()}function Qt(e){return e===`top`||e===`center`?e:`nearest`}function $t(e,t,n){if(e===0)return-1;if(n!=null){let e=t(n);if(e!=null)return e;let r=Vt(n);for(let e=r.length-1;e>=0;--e){let n=r[e];if(n==null)continue;let i=t(n);if(i!=null)return i}}return 0}function en(e,t,n){if(e.paths.length===0)return{focusedIndex:-1,getParentIndex:e.getParentIndex,paths:e.paths,posInSetByIndex:e.posInSetByIndex,setSizeByIndex:e.setSizeByIndex};if(t==null)return{focusedIndex:0,getParentIndex:e.getParentIndex,paths:e.paths,posInSetByIndex:e.posInSetByIndex,setSizeByIndex:e.setSizeByIndex};let r=n??(t=>e.visibleIndexByPath.get(t)??null);return{focusedIndex:$t(e.paths.length,r,t),getParentIndex:e.getParentIndex,paths:e.paths,posInSetByIndex:e.posInSetByIndex,setSizeByIndex:e.setSizeByIndex}}var tn,nn,rn,an;function on(){return(on=e((()=>{we(),yt(),jt(),Kt(),Zt(),tn=Symbol(`FILE_TREE_RENAME_VIEW`),nn=512,rn=512,an=class{#e;#t=new Set;#n=new Map;#r=null;#i=null;#a=new Map;#o=new Map;#s=-1;#c=null;#l=!1;#u=e=>-1;#d=new Map;#f=null;#p=null;#m=null;#h=null;#g=null;#_;#v;#y;#b=[];#x=new Int32Array;#S=new Int32Array;#C=void 0;#w=!1;#T=null;#E=``;#D=!1;#O=new Set;#k=[];#A;#j=null;#M=null;#N=null;#P=null;#F=null;#I=null;#L=null;#R=0;#z=null;#B=new Set;#V=0;#H;#U=0;#W=!1;#G=0;#K;constructor(e){let{dragAndDrop:t,fileTreeSearchMode:n,initialSearchQuery:r,initialSelectedPaths:i,renaming:a,onSearchChange:o,paths:s,preparedInput:c,...l}=e,u=At({paths:s,preparedInput:c},`constructor`,l.sort);this.#e=l,t!=null&&t!==!1&&(this.#r=t===!0?{}:t),this.#w=a!=null&&a!==!1,a!=null&&a!==!1&&a!==!0&&(this.#C=a.canRename,this.#v=a.onError,this.#_=a.onRename),this.#y=o,this.#A=n??`hide-non-matches`,this.#H=this.#le(u.paths,u.preparedInput);let d=i?.map(e=>this.#Ne(e)).filter(e=>e!=null)??[],f=d.at(-1)??null;d.length>0&&(this.#B=new Set(d),this.#z=f,this.#V=1),this.#je(f,!1),r!=null&&this.#Te(r,!1),this.#K=this.#Re()}destroy(){this.#K?.(),this.#K=null,this.#n.clear(),this.#t.clear(),this.#d.clear(),this.#i=null,this.#he()}focusFirstItem(){this.#be().length>0&&this.#Fe(0)}focusLastItem(){this.#G<=0||(this.#Ie(),this.#Fe(this.#G-1))}focusNextItem(){this.#Ae(1)}focusParentItem(){if(this.#c==null)return;let e=Ht(this.#c);if(e==null)return;let t=this.#Z(e);t>=0&&this.#Fe(t)}focusPath(e){let t=this.#H.getPathInfo(e)?.path??null;if(t==null)return;this.#Ie();let n=this.#Z(t);n>=0&&this.#Fe(n)}scrollToPath(e,t){let n=this.#H.getPathInfo(e)?.path??null;if(n==null)return;this.#Ie();let r=this.#xe(n);r<0||this.#Me(r)!=null&&(t?.focus!==!1&&this.#Fe(r,!1),this.#L={id:this.#R+=1,offset:Qt(t?.offset),visibleIndex:r},this.#De())}focusMountedPathFromInput(e){let t=this.#H.getPathInfo(e)?.path??null;if(t==null)return;let n=this.#Z(t);n>=0&&this.#Fe(n)}focusNearestPath(e){let t=this.resolveNearestVisiblePath(e);if(t==null)return null;let n=this.#Z(t);return n>=0?(this.#Fe(n),this.#be()[n]??t):null}focusPreviousItem(){this.#Ae(-1)}getFocusedIndex(){return this.#s}getFocusedItem(){return this.#c==null?null:this.#Q(this.#c)}getFocusedPath(){return this.#c}getScrollRequest(){return this.#L}clearScrollRequest(e){this.#L?.id===e&&(this.#L=null)}resolveNearestVisiblePath(e){let t=this.#be();if(this.#G===0)return null;if(e==null)return this.#c??t[0]??null;let n=this.#H.getPathInfo(e)?.path??e,r=this.#Z(n);return r>=0?t[r]??n:this.#X(n)??this.#c??t[0]??null}getSelectedPaths(){return[...this.#B]}getSelectionVersion(){return this.#V}getVisibleCount(){return this.#G}getVisibleRows(e,t){if(t<e||this.#G===0)return[];let n=Math.max(0,e),r=Math.min(this.#G-1,t);if(r<n)return[];let i=r-n+1;if(this.#F==null&&!this.#l&&r>=this.#b.length&&i<=rn){let e=[];for(let t=n;t<=r;t+=1){let n=this.#H.getVisibleRowContext(t);if(n==null)break;e.push(this.#ee(n))}return e}if(!this.#l&&r>=this.#b.length&&this.#Ie(),this.#F!=null){let e=Array.from({length:r-n+1},(e,t)=>this.#Se(n+t)),t=new Map,i=e[0]??-1,a=i;for(let n=1;n<=e.length;n+=1){let r=e[n];if(r!=null&&r===a+1){a=r;continue}if(i>=0&&this.#H.getVisibleSlice(i,a).forEach((e,n)=>{t.set(i+n,e)}),r==null){i=-1,a=-1;continue}i=r,a=r}return Array.from({length:r-n+1},(e,r)=>{let i=n+r,a=this.#Se(i),o=t.get(a),s=this.#b[a];if(o==null||s==null)throw Error(`Missing projection row for filtered visible index ${String(i)}`);return this.#$(o,i,a,{ancestorPaths:this.#re(a),path:s})})}return this.#H.getVisibleSlice(n,r).map((e,t)=>{let r=n+t,i=this.#b[r];if(i==null)throw Error(`Missing projection path for visible index ${String(r)}`);return this.#$(e,r,r,{ancestorPaths:this.#re(r),path:i})})}getStickyRowCandidates(e,t){if(this.#F!=null)return null;if(this.#G===0||e<=0||t<=0)return[];let n=[];for(let r=0;r<this.#G;r+=1){let i=e+r*t,a=Math.min(this.#G-1,Math.floor(i/t)),o=this.#te(a,r)??(a>0?this.#te(a-1,r):void 0);if(o==null)break;n.push({row:this.#ee(o),subtreeEndIndex:o.subtreeEndIndex})}return n}getItem(e){let t=this.#H.getPathInfo(e);return t==null?null:this.#Q(t.path,t)}resolveMountedDirectoryPathFromInput(e){let t=this.#H.getPathInfo(e);return t?.kind===`directory`?t.path:null}toggleMountedDirectoryFromInput(e){let t=this.resolveMountedDirectoryPathFromInput(e);t!=null&&this.#ze(t)}selectAllVisiblePaths(){this.#Ie();let e=[...this.#be()];this.#ae(e,this.#c??this.#z)}selectOnlyPath(e){let t=this.#Ne(e);t!=null&&this.#ae([t],t)}selectOnlyMountedPathFromInput(e){this.#ae([e],e)}selectPath(e){let t=this.#Ne(e);t==null||this.#B.has(t)||this.#ae([...this.#B,t])}deselectPath(e){let t=this.#Ne(e);t!=null&&this.#B.has(t)&&this.#ae([...this.#B].filter(e=>e!==t))}toggleFocusedSelection(){this.#c!=null&&this.togglePathSelectionFromInput(this.#c)}togglePathSelection(e){let t=this.#Ne(e);if(t!=null){if(this.#B.has(t)){this.deselectPath(t);return}this.selectPath(t)}}togglePathSelectionFromInput(e){let t=this.#Ne(e);if(t!=null){if(this.#B.has(t)){this.#ae([...this.#B].filter(e=>e!==t),t);return}this.#ae([...this.#B,t],t)}}selectPathRange(e,t){let n=this.#Ne(e);if(n==null)return;this.#Ie();let r=this.#z,i=r==null?-1:this.#Ce(r),a=this.#Ce(n);if(i===-1||a===-1){let e=t?[...this.#B,n]:[n];this.#ae(e,n);return}let[o,s]=i<=a?[i,a]:[a,i],c=this.#be().slice(o,s+1),l=t?[...this.#B,...c]:c;this.#ae(l,r)}extendSelectionFromFocused(e){if(this.#c==null)return;let t=this.#s;if(t===-1)return;let n=Math.min(this.#G-1,Math.max(0,t+e));if(n===t)return;!this.#l&&n>=this.#b.length&&this.#Ie();let r=this.#be(),i=r[t]??null,a=r[n]??null;if(i==null||a==null)return;let o=new Set(this.#B);o.has(i)&&o.has(a)?o.delete(i):o.add(a),this.#ae([...o],this.#z??i,!1),this.#Fe(n)}getDragAndDropConfig(){return this.#r}isDragAndDropEnabled(){return this.#r!=null}getDragSession(){return this.#i==null?null:{draggedPaths:[...this.#i.draggedPaths],primaryPath:this.#i.primaryPath,target:this.#i.target==null?null:{...this.#i.target}}}startDrag(e){if(this.#r==null)return!1;let t=this.#Ne(e);if(t==null||this.#M!=null&&this.#M.length>0)return!1;let n=this.getSelectedPaths(),r=Ct(t,n);return this.#r.canDrag?.(r)!==!1&&(n.includes(t)||this.#ae([t],t,!1),this.#Pe(t),this.#i={draggedPaths:r,primaryPath:t,target:null},this.#De(),!0)}setDragTarget(e){let t=this.#i;if(t==null)return;let n=e;if(n!=null){let e=Tt(t.draggedPaths,n);(Et(t.draggedPaths,n)||this.#r?.canDrop?.(e)===!1)&&(n=null)}wt(t.target,n)||(this.#i={...t,target:n},this.#De())}cancelDrag(){this.#i!=null&&(this.#i=null,this.#De())}completeDrag(){let e=this.#i;if(e==null)return!1;this.#i=null;let t=e.target==null?null:{...e.target};if(t==null)return this.#De(),!1;let n=Tt(e.draggedPaths,t);if(Et(e.draggedPaths,t)||this.#r?.canDrop?.(n)===!1)return this.#De(),!1;let r=Ot(e.draggedPaths,t);if(r==null)return this.#De(),!1;try{if(r.operations.length===1){let e=r.operations[0];if(e==null||e.type!==`move`)throw Error(`Expected a single move operation for one-item drops`);this.#H.move(e.from,e.to,{collision:e.collision})}else this.#ce(r.operations),this.#H.batch(r.operations)}catch(e){return this.#De(),this.#r?.onDropError?.(e instanceof Error?e.message:String(e),n),!1}return this.#r?.onDropComplete?.(r.result),!0}subscribe(e){return this.#t.add(e),e(),()=>{this.#t.delete(e)}}add(e){this.#H.add(e)}remove(e,t={}){this.#H.remove(e,t)}move(e,t,n={}){this.#H.move(e,t,n)}batch(e){this.#H.batch(e)}onMutation(e,t){let n=e,r=t,i=this.#n.get(n);return i??(i=new Set,this.#n.set(n,i)),i.add(r),()=>{let e=this.#n.get(n);e?.delete(r),e?.size===0&&this.#n.delete(n)}}setSearch(e){this.#Te(e,!0)}openSearch(e=``){this.#Te(e,!0)}closeSearch(){this.#Te(null,!0)}isSearchOpen(){return this.#M!==null}getSearchValue(){return this.#M??``}getSearchMatchingPaths(){return this.#k}focusNextSearchMatch(){this.#we(1)}focusPreviousSearchMatch(){this.#we(-1)}startRenaming(e=this.#c??``,t={}){if(!this.#w)return!1;let n=this.#H.getPathInfo(e);if(n==null)return!1;let r=n.path,i=Wt(r),a=Jt(r);if(this.#C?.({isFolder:i,path:a})===!1)return!1;for(let e of Vt(r))this.#H.isExpanded(e)||this.#H.expand(e);return this.#ae([r],r,!1),this.#M!=null&&(this.#Te(null,!1),this.#y?.(this.#M)),this.#Pe(r),this.#T=r,this.#E=qt(r),this.#D=t.removeIfCanceled??!1,this.#De(),!0}[tn](){return{cancel:()=>{this.#q()},commit:()=>{this.#J()},getPath:()=>this.#T,getValue:()=>this.#E,isActive:()=>this.#T!=null,setValue:e=>{this.#Y(e)}}}#q(){if(this.#T==null)return;let e=this.#T,t=this.#D;if(this.#T=null,this.#E=``,this.#D=!1,t){this.remove(e,Wt(e)?{recursive:!0}:void 0);return}this.#Pe(e),this.#De()}#J(){let e=this.#T;if(e==null)return;if(this.#D&&this.#E.trim().length===0){this.#T=null,this.#E=``,this.#D=!1,this.remove(e,Wt(e)?{recursive:!0}:void 0);return}let t=Wt(e),n=vt({files:this.#H.list(),isFolder:t,nextBasename:this.#E,path:Jt(e)});if(this.#T=null,this.#E=``,this.#D=!1,`error`in n){this.#Pe(e),this.#v?.(n.error),this.#De();return}if(n.sourcePath===n.destinationPath){this.#Pe(e),this.#De();return}this.#_?.({destinationPath:n.destinationPath,isFolder:n.isFolder,sourcePath:n.sourcePath}),this.move(Yt(n.sourcePath,t),Yt(n.destinationPath,t))}#Y(e){this.#T!=null&&this.#E!==e&&(this.#E=e,this.#De())}resetPaths(e,t={}){let n=this.#H.list().length,r=this.#G,i=At({paths:e,preparedInput:t.preparedInput},`resetPaths`,this.#e.sort),a=this.#le(i.paths,i.preparedInput,t.initialExpandedPaths),o=this.#c,s=this.#T,c=this.getSelectedPaths(),l=this.#z;this.#K?.(),this.#H=a,this.#d.clear(),this.#he();let u=c.map(e=>a.getPathInfo(e)?.path??null).filter(e=>e!=null),d=!Bt(this.#B,u);this.#B=new Set(u),d&&(this.#V+=1),this.#z=l==null?null:a.getPathInfo(l)?.path??null,this.#T=s==null?null:a.getPathInfo(s)?.path??null,this.#T??(this.#E=``,this.#D=!1),this.#je(o,o!=null||u.length>0||this.#z!=null),this.#K=this.#Re(),this.#De(),this.#Oe({canonicalChanged:!0,operation:`reset`,pathCountAfter:i.paths.length,pathCountBefore:n,projectionChanged:!0,usedPreparedInput:t.preparedInput!=null,visibleCountDelta:this.#G-r})}#X(e){this.#Ie();let t=Ht(e),n=Ut(e,t),r=null,i=null;for(let e of this.#be()){if(Ht(e)!==t)continue;let a=Ut(e,t);if(a<n){r=e;continue}if(a>n){i=e;break}}return r??i}#Z(e){let t=this.#Ce(e);if(t!==-1)return t;let n=Vt(e);for(let e=n.length-1;e>=0;--e){let t=n[e];if(t==null)continue;let r=this.#Ce(t);if(r!==-1)return r}return this.#be().length>0?0:-1}#Q(e,t){let n=this.#d.get(e);if(n!=null)return n;let r=t??this.#H.getPathInfo(e);if(r==null)return null;let i=r.kind===`directory`?this.#oe(r.path):this.#se(r.path);return this.#d.set(r.path,i),i}#$(e,t,n,r){return{ancestorPaths:r.ancestorPaths,depth:e.depth,flattenedSegments:e.flattenedSegments?.map(e=>({isTerminal:e.isTerminal,name:e.name,path:e.path})),hasChildren:e.hasChildren,index:t,isExpanded:e.isExpanded,isFlattened:e.isFlattened,isFocused:r.path===this.#c,isSelected:this.#B.has(r.path),kind:e.kind,level:e.depth,name:e.name,path:r.path,posInSet:r.posInSet??this.#x[n]??0,setSize:r.setSize??this.#S[n]??0}}#ee(e){return this.#$(e.row,e.index,e.index,{ancestorPaths:e.ancestorPaths,path:e.row.path,posInSet:e.posInSet,setSize:e.setSize})}#te(e,t){let n=this.#H.getVisibleRowContext(e);return n==null?void 0:n.ancestorRows[t]??(t===n.ancestorRows.length&&n.row.kind===`directory`&&n.row.isExpanded?n:void 0)}#ne(e){let t=this.#a.get(e);if(t!=null)return t;let n=this.#u(e),r=n<0?[]:[...this.#ne(n),n];return this.#a.set(e,r),r}#re(e){let t=this.#o.get(e);if(t!=null)return t;let n=this.#ne(e).map(e=>this.#b[e]??``).filter(e=>e!==``);return this.#o.set(e,n),n}#ie(e){this.#H.collapse(e)}#ae(e,t=this.#z,n=!0){let r=[...new Set(e)],i=!Bt(this.#B,r),a=this.#z!==t;(i||a)&&(this.#B=new Set(r),this.#z=t,i&&(this.#V+=1),n&&this.#De())}#oe(e){return{collapse:()=>{this.#ie(e)},deselect:()=>{this.deselectPath(e)},expand:()=>{this.#ke(e)},focus:()=>{this.focusPath(e)},getPath:()=>e,isDirectory:()=>!0,isExpanded:()=>this.#H.isExpanded(e),isFocused:()=>this.#c===e,isSelected:()=>this.#B.has(e),select:()=>{this.selectPath(e)},toggleSelect:()=>{this.togglePathSelection(e)},toggle:()=>{this.#ze(e)}}}#se(e){return{deselect:()=>{this.deselectPath(e)},focus:()=>{this.focusPath(e)},getPath:()=>e,isDirectory:()=>!1,isFocused:()=>this.#c===e,isSelected:()=>this.#B.has(e),select:()=>{this.selectPath(e)},toggleSelect:()=>{this.togglePathSelection(e)}}}#ce(e){let t=this.#H.list();this.#le(t).batch(e)}#le(e,t,n){return new ye({...this.#e,paths:e,preparedInput:t??void 0,...n===void 0?{}:{initialExpandedPaths:n}})}#ue(){return this.#h??=this.#H.list(),this.#h}#de(){if(this.#m!=null)return this.#m;let e=new Set;for(let t of this.#ue()){e.add(t);for(let n of Vt(t))e.add(n)}return this.#m=[...e].sort(),this.#m}#fe(){return this.#g??=this.#ue().map(Gt),this.#g}#pe(){return this.#f??=this.#de().filter(e=>e.endsWith(`/`)),this.#f}#me(){return this.#p??=this.#pe().map(Gt),this.#p}#he(){this.#f=null,this.#p=null,this.#m=null,this.#h=null,this.#g=null}#ge(){return this.#pe().filter(e=>this.#H.isExpanded(e))}#_e(e){let t=new Set(this.#j??[]);if(e)for(let e of this.#B)for(let n of Vt(e))t.add(n);this.#ve(t)}#ve(e){this.#W=!0;try{for(let t of this.#pe()){let n=e.has(t),r=this.#H.isExpanded(t);n&&!r?this.#H.expand(t):!n&&r&&this.#H.collapse(t)}}finally{this.#W=!1}}#ye(){if(this.#M==null||this.#M.length===0){this.#k=[],this.#F=null,this.#I=null,this.#P=null,this.#G=this.#U;return}let e=this.#b;if(this.#k=e.filter(e=>this.#O.has(e)),this.#A!==`hide-non-matches`||this.#O.size===0){this.#F=null,this.#I=null,this.#P=null,this.#G=this.#U;return}let t=[],n=[],r=new Map;for(let[i,a]of e.entries())this.#N?.has(a)===!0&&(r.set(a,n.length),t.push(i),n.push(a));this.#F=t,this.#I=n,this.#P=r,this.#G=n.length}#be(){return this.#I??this.#b}#xe(e){return this.#I==null?this.#H.getVisibleIndex(e)??-1:this.#P?.get(e)??-1}#Se(e){return this.#F?.[e]??e}#Ce(e){return this.#P?.get(e)??this.#H.getVisibleIndex(e)??-1}#we(e){let t=this.#k;if(t.length===0)return;let n=this.#c,r=n==null?-1:t.indexOf(n),i=t[r<0?e>0?0:t.length-1:Math.min(t.length-1,Math.max(0,r+e))];i!=null&&this.focusPath(i)}#Te(e,t){let n=e==null?null:Xt(e),r=this.#M;if(r!==n){if(r==null&&n!=null&&(this.#j=this.#ge()),this.#M=n,n==null)this.#_e(!0),this.#j=null,this.#O.clear(),this.#N=null,this.#je(this.#c,!0);else if(n.length===0)this.#_e(!1),this.#O.clear(),this.#N=null,this.#je(this.#c,!0);else{let e=this.#Ee();this.#je(e,!0)}t&&(this.#y?.(this.#M),this.#De())}}#Ee(){if(this.#M==null||this.#M.length===0)return this.#O.clear(),this.#c;let e=this.#M,t=this.#ue(),n=this.#fe(),r=[],i=new Set,a=null;for(let o=0;o<t.length;o+=1){if(!n[o].includes(e))continue;let s=t[o];r.push(s),i.add(s),a??=s}let o=this.#pe(),s=this.#me();for(let t=0;t<o.length;t+=1){if(!s[t].includes(e))continue;let n=o[t];i.has(n)||(r.push(n),i.add(n),a??=n)}this.#O=i;let c=this.#A===`hide-non-matches`&&r.length>0?new Set:null;this.#N=c;let l=this.#A===`expand-matches`?new Set(this.#j??[]):new Set;for(let e of r){c?.add(e),e.endsWith(`/`)&&l.add(e);for(let t of Vt(e))l.add(t),c?.add(t)}return this.#ve(l),a??this.#c}#De(){for(let e of this.#t)e()}#Oe(e){this.#n.get(e.operation)?.forEach(t=>{t(e)}),this.#n.get(`*`)?.forEach(t=>{t(e)})}#ke(e){for(let t of Vt(e))this.#H.isExpanded(t)||this.#H.expand(t);this.#H.isExpanded(e)||this.#H.expand(e)}#Ae(e){let t=this.#G;if(t===0)return;let n=this.#s===-1?0:this.#s,r=Math.min(t-1,Math.max(0,n+e));(r!==n||this.#s===-1)&&(!this.#l&&this.#F==null&&r>=this.#b.length&&this.#Ie(),this.#Fe(r))}#je(e,t=!0){let n=this.#H.getVisibleCount();this.#U=n;let r=en(this.#H.getVisibleTreeProjectionData(t?void 0:Math.min(n,nn)),e,t?e=>this.#H.getVisibleIndex(e):void 0);this.#a.clear(),this.#o.clear(),this.#l=r.paths.length>=n,this.#u=r.getParentIndex,this.#b=r.paths,this.#x=r.posInSetByIndex,this.#S=r.setSizeByIndex,this.#ye(),this.#s=e==null?this.#be().length>0?0:-1:this.#Z(e),this.#c=this.#s<0?null:this.#Me(this.#s)}#Me(e){return this.#be()[e]??(this.#F==null?this.#H.getVisibleRowContext(e)?.row.path??null:null)}#Ne(e){return this.#H.getPathInfo(e)?.path??null}#Pe(e){if(e==null)return;let t=this.#Z(e);t>=0&&this.#Fe(t,!1)}#Fe(e,t=!0){let n=this.#Me(e);n!=null&&(this.#s!==e||this.#c!==n)&&(this.#s=e,this.#c=n,t&&this.#De())}#Ie(){this.#l||this.#je(this.#c,!0)}#Le(e){let t=Ft(this.#T,e);t==null&&this.#T!=null&&(this.#E=``),this.#T=t;let n=Ft(this.#c,e,!0),r=[...this.#B].map(t=>Ft(t,e)).filter(e=>e!=null).map(e=>this.#H.getPathInfo(e)?.path??null).filter(e=>e!=null),i=Ft(this.#z,e),a=i==null?null:this.#H.getPathInfo(i)?.path??null,o=[...new Set(r)];return Bt(this.#B,o)||(this.#B=new Set(o),this.#V+=1),this.#z=a,n}#Re(){return this.#H.on(`*`,e=>{if(this.#W)return;e.canonicalChanged&&(this.#d.clear(),this.#he()),this.#i!=null&&Mt(e)&&(this.#i=null);let t=Mt(e)?this.#Le(e):this.#c,n=this.#M!=null&&this.#M.length>0?this.#Ee():this.#M===``?this.#c:t,r=this.#M!=null||e.operation!==`expand`&&e.operation!==`collapse`;this.#je(n,r),this.#De();let i=zt(e);i!=null&&this.#Oe(i)})}#ze(e){if(this.#H.isExpanded(e)){this.#ie(e);return}this.#ke(e)}}})))()}var sn;function cn(){return(cn=e((()=>{sn=e=>{if(e==null||e.length===0)return`0`;let t=`${e.length}`;for(let n of e)t+=`\0${n.path}\0${n.status}`;return t}})))()}function ln(e){let t=e.endsWith(`/`),n=``,r=-1;for(let t=0;t<=e.length;t+=1){if(e[t]!==`/`&&t!==e.length){r===-1&&(r=t);continue}r!==-1&&(n!==``&&(n+=`/`),n+=e.slice(r,t),r=-1)}return n===``?null:{isDirectory:t,path:n}}function un(e){let t=e.endsWith(`/`)?e.slice(0,-1):e;if(t.length===0)return[];let n=t.split(`/`);return n.slice(0,-1).map((e,t)=>`${n.slice(0,t+1).join(`/`)}/`)}function dn(e,t){return t?`${e}/`:e}function fn(e,t=null){let n=sn(e==null?void 0:[...e]);if(n===`0`)return null;if(t?.signature===n)return t;let r=new Map,i=new Set,a=new Set;for(let t of e??[]){let e=ln(t.path);if(e==null)continue;let n=dn(e.path,e.isDirectory);r.set(n,t.status),t.status===`ignored`&&e.isDirectory?a.add(n):e.isDirectory&&a.delete(n);for(let t of un(e.path))i.add(t)}return{directoriesWithChanges:i,ignoredDirectoryPaths:a,signature:n,statusByPath:r}}function pn(){return(pn=e((()=>{cn()})))()}function mn(e){e&&e.parentNode&&e.remove()}function hn(e,t,n){var r,i,a,o={};for(a in t)a==`key`?r=t[a]:a==`ref`&&typeof e!=`function`?i=t[a]:o[a]=t[a];return arguments.length>2&&(o.children=arguments.length>3?Qn.call(arguments,2):n),gn(e,o,r,i,null)}function gn(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++Bn,__i:-1,__u:0};return i==null&&Y.vnode!=null&&Y.vnode(a),a}function _n(e){return e.children}function vn(e,t){this.props=e,this.context=t,this.__g=0}function yn(e,t){if(t==null)return e.__?yn(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==`function`?yn(e):null}function bn(e){var t,n;if((e=e.__)!=null&&e.__c!=null){for(e.__e=null,t=0;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null){e.__e=n.__e;break}return bn(e)}}function xn(e){(8&e.__g||!(e.__g|=8)||!Vn.push(e)||Un++)&&Hn==Y.debounceRendering||((Hn=Y.debounceRendering)||queueMicrotask)(Sn)}function Sn(){for(var e,t,n,r,i,a,o,s,c=1;Vn.length;)Vn.length>c&&Vn.sort(Wn),e=Vn.shift(),c=Vn.length,8&e.__g&&(n=void 0,i=(r=(t=e).__v).__e,a=[],o=[],(s=t.__P)&&((n=$n({},r)).__v=r.__v+1,Y.vnode&&Y.vnode(n),An(s,n,r,t.__n,s.namespaceURI,32&r.__u?[i]:null,a,i??yn(r),!!(32&r.__u),o,s.ownerDocument),n.__v=r.__v,n.__.__k[n.__i]=n,Mn(a,n,o),n.__e!=i&&bn(n)));Un=0}function Cn(e,t,n,r,i,a,o,s,c,l,u,d){var f,p,m,h,g,_,v,y=r&&r.__k||Xn,b=t.length;for(c=wn(n,t,y,c,b),f=0;f<b;f++)(m=n.__k[f])!=null&&(p=m.__i==-1?Yn:y[m.__i]||Yn,m.__i=f,_=An(e,m,p,i,a,o,s,c,l,u,d),h=m.__e,m.ref&&p.ref!=m.ref&&(p.ref&&Fn(p.ref,null,m),u.push(m.ref,m.__c||h,m)),g==null&&h!=null&&(g=h),(v=!!(4&m.__u))||p.__k===m.__k?c=Tn(m,c,e,v):typeof m.type==`function`&&_!==void 0?c=_:h&&(c=h.nextSibling),m.__u&=-7);return n.__e=g,c}function wn(e,t,n,r,i){var a,o,s,c,l,u=n.length,d=u,f=0;for(e.__k=Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(c=a+f,(o=e.__k[a]=typeof o==`string`||typeof o==`number`||typeof o==`bigint`||o.constructor==String?gn(null,o,null,null,null):Zn(o)?gn(_n,{children:o},null,null,null):o.constructor==null&&o.__b>0?gn(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):o).__=e,o.__b=e.__b+1,s=null,(l=o.__i=En(o,n,c,d))!=-1&&(d--,(s=n[l])&&(s.__u|=2)),s==null||s.__v==null?(l==-1&&(i>u?f--:i<u&&f++),typeof o.type!=`function`&&(o.__u|=4)):l!=c&&(l==c-1?f--:l==c+1?f++:(l>c?f--:f++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<u;a++)(s=n[a])!=null&&!(2&s.__u)&&(s.__e==r&&(r=yn(s)),In(s,s));return r}function Tn(e,t,n,r){var i,a;if(typeof e.type==`function`){for(i=e.__k,a=0;i&&a<i.length;a++)i[a]&&(i[a].__=e,t=Tn(i[a],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=yn(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t&&=t.nextSibling;while(t!=null&&t.nodeType==8);return t}function En(e,t,n,r){var i,a,o,s=e.key,c=e.type,l=t[n],u=l!=null&&!(2&l.__u);if(l===null&&e.key==null||u&&s==l.key&&c==l.type)return n;if(r>+!!u){for(i=n-1,a=n+1;i>=0||a<t.length;)if((l=t[o=i>=0?i--:a++])!=null&&!(2&l.__u)&&s==l.key&&c==l.type)return o}return-1}function Dn(e,t,n){t[0]==`-`?e.setProperty(t,n??``):e[t]=n??``}function On(e,t,n,r,i){var a;n:if(t==`style`){if(typeof n==`string`)e.style.cssText=n;else{if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||Dn(e.style,t,``);if(n)for(t in n)r&&n[t]==r[t]||Dn(e.style,t,n[t])}}else if(t[0]==`o`&&t[1]==`n`)a=t!=(t=t.replace(Gn,`$1`)),(t=t.slice(2))[0].toLowerCase()!=t[0]&&(t=t.toLowerCase()),e.__l||={},e.__l[t+a]=n,n?r?n.l=r.l:(n.l=Kn,e.addEventListener(t,a?Jn:qn,a)):e.removeEventListener(t,a?Jn:qn,a);else{if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;break n}catch{}typeof n==`function`||(n==null||!1===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n))}}function kn(e){return function(t){if(this.__l){var n=this.__l[t.type+e];if(t.u==null)t.u=Kn++;else if(t.u<n.l)return;return n(Y.event?Y.event(t):t)}}}function An(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M=t.type;if(t.constructor!=null)return null;128&n.__u&&(c=!!(32&n.__u),n.__c.__z&&(s=t.__e=n.__e=(a=n.__c.__z)[0],n.__c.__z=null)),(d=Y.__b)&&d(t);n:if(typeof M==`function`)try{if(v=t.props,y=`prototype`in M&&M.prototype.render,b=(d=M.contextType)&&r[d.__c],x=d?b?b.props.value:d.__:r,n.__c?2&(f=t.__c=n.__c).__g&&(f.__g|=1,_=!0):(y?t.__c=f=new M(v,x):(t.__c=f=new vn(v,x),f.constructor=M,f.render=Ln),b&&b.sub(f),f.props=v,f.state||(f.state={}),f.context=x,f.__n=r,p=!0,f.__g|=8,f.__h=[],f._sb=[]),y&&f.__s==null&&(f.__s=f.state),y&&M.getDerivedStateFromProps!=null&&(f.__s==f.state&&(f.__s=$n({},f.__s)),$n(f.__s,M.getDerivedStateFromProps(v,f.__s))),m=f.props,h=f.state,f.__v=t,p)y&&M.getDerivedStateFromProps==null&&f.componentWillMount!=null&&f.componentWillMount(),y&&f.componentDidMount!=null&&f.__h.push(f.componentDidMount);else{if(y&&M.getDerivedStateFromProps==null&&v!==m&&f.componentWillReceiveProps!=null&&f.componentWillReceiveProps(v,x),!(4&f.__g)&&f.shouldComponentUpdate!=null&&!1===f.shouldComponentUpdate(v,f.__s,x)||t.__v==n.__v){for(t.__v!=n.__v&&(f.props=v,f.state=f.__s,f.__g&=-9),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),S=0;S<f._sb.length;S++)f.__h.push(f._sb[S]);f._sb=[],f.__h.length&&o.push(f);break n}f.componentWillUpdate!=null&&f.componentWillUpdate(v,f.__s,x),y&&f.componentDidUpdate!=null&&f.__h.push(function(){f.componentDidUpdate(m,h,g)})}if(f.context=x,f.props=v,f.__P=e,f.__g&=-5,C=Y.__r,w=0,y){for(f.state=f.__s,f.__g&=-9,C&&C(t),d=f.render(f.props,f.state,f.context),T=0;T<f._sb.length;T++)f.__h.push(f._sb[T]);f._sb=[]}else do f.__g&=-9,C&&C(t),d=f.render(f.props,f.state,f.context),f.state=f.__s;while(8&f.__g&&++w<25);f.state=f.__s,f.getChildContext!=null&&(r=$n({},r,f.getChildContext())),y&&!p&&f.getSnapshotBeforeUpdate!=null&&(g=f.getSnapshotBeforeUpdate(m,h)),E=d,d!=null&&d.type===_n&&d.key==null&&(E=Nn(d.props.children)),s=Cn(e,Zn(E)?E:[E],t,n,r,i,a,o,s,c,l,u),t.__u&=-161,f.__h.length&&o.push(f),_&&(f.__g&=-4)}catch(e){if(t.__v=null,c||a!=null){if(e.then){for(D=0,O=!1,t.__u|=c?160:128,t.__c.__z=[],k=0;k<a.length;k++)(A=a[k])==null||O||(A.nodeType==8&&A.data==`$s`?(D>0&&t.__c.__z.push(A),D++,a[k]=null):A.nodeType==8&&A.data==`/$s`?(--D>0&&t.__c.__z.push(A),O=D===0,s=a[k],a[k]=null):D>0&&(t.__c.__z.push(A),a[k]=null));if(!O){for(;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;a[a.indexOf(s)]=null,t.__c.__z=[s]}t.__e=s}else{for(j=a.length;j--;)mn(a[j]);jn(t)}}else t.__e=n.__e,t.__k=n.__k,e.then||jn(t);Y.__e(e,t,n)}else s=t.__e=Pn(n.__e,t,n,r,i,a,o,c,l,u);return(d=Y.diffed)&&d(t),128&t.__u?void 0:s}function jn(e){e&&e.__c&&(e.__c.__g|=4),e&&e.__k&&e.__k.forEach(jn)}function Mn(e,t,n){for(var r=0;r<n.length;r++)Fn(n[r],n[++r],n[++r]);Y.__c&&Y.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){Y.__e(e,t.__v)}})}function Nn(e){return typeof e!=`object`||!e||e.__b&&e.__b>0?e:Zn(e)?e.map(Nn):$n({},e)}function Pn(e,t,n,r,i,a,o,s,c,l){var u,d,f,p,m,h,g,_,v=n.props,y=t.props,b=t.type;if(b==`svg`?i=`http://www.w3.org/2000/svg`:b==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a!=null){for(u=0;u<a.length;u++)if((m=a[u])&&`setAttribute`in m==!!b&&(b?m.localName==b:m.nodeType==3)){e=m,a[u]=null;break}}if(e==null){if(b==null)return l.createTextNode(y);e=l.createElementNS(i,b,y.is&&y),s&&=(Y.__m&&Y.__m(t,a),!1),a=null}if(b==null)v===y||s&&e.data==y||(e.data=y);else{if(a&&=Qn.call(e.childNodes),v=n.props||Yn,!s&&a!=null)for(v={},u=0;u<e.attributes.length;u++)v[(m=e.attributes[u]).name]=m.value;for(u in v)if(m=v[u],u!=`children`){if(u==`dangerouslySetInnerHTML`)f=m;else if(!(u in y)){if(u==`value`&&`defaultValue`in y||u==`checked`&&`defaultChecked`in y)continue;On(e,u,null,m,i)}}for(u in _=1&n.__u,y)m=y[u],u==`children`?p=m:u==`dangerouslySetInnerHTML`?d=m:u==`value`?h=m:u==`checked`?g=m:s&&typeof m!=`function`||v[u]===m&&!_||On(e,u,m,v[u],i);if(d)s||f&&(d.__html==f.__html||d.__html==e.innerHTML)||(e.innerHTML=d.__html),t.__k=[];else if(f&&(e.innerHTML=``),Cn(b==`template`?e.content:e,Zn(p)?p:[p],t,n,r,b==`foreignObject`?`http://www.w3.org/1999/xhtml`:i,a,o,a?a[0]:n.__k&&yn(n,0),s,c,l),a!=null)for(u=a.length;u--;)mn(a[u]);s||(u=`value`,b==`progress`&&h==null?e.removeAttribute(`value`):h==null||h===e[u]&&(b!==`progress`||h)||On(e,u,h,v[u],i),u=`checked`,g!=null&&g!=e[u]&&On(e,u,g,v[u],i))}return e}function Fn(e,t,n){try{if(typeof e==`function`){var r=typeof e.__u==`function`;r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(e){Y.__e(e,n)}}function In(e,t,n){var r,i;if(Y.unmount&&Y.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||Fn(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(e){Y.__e(e,t)}r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&In(r[i],t,n||typeof e.type!=`function`);n||mn(e.__e),e.__e&&e.__e.__l&&(e.__e.__l=null),e.__e=e.__c=e.__=null}function Ln(e,t,n){return this.constructor(e,n)}function Rn(e,t){var n,r,i,a;t==document&&(t=document.documentElement),Y.__&&Y.__(e,t),r=(n=!!(e&&32&e.__u))?null:t.__k,e=t.__k=hn(_n,null,[e]),i=[],a=[],An(t,e,r||Yn,Yn,t.namespaceURI,r?null:t.firstChild?Qn.call(t.childNodes):null,i,r?r.__e:t.firstChild,n,a,t.ownerDocument),Mn(i,e,a)}function zn(e,t){e.__u|=32,Rn(e,t)}var Y,Bn,Vn,Hn,Un,Wn,Gn,Kn,qn,Jn,Yn,Xn,Zn,Qn,$n;function er(){return(er=e((()=>{Yn={},Xn=[],Zn=Array.isArray,Qn=Xn.slice,$n=Object.assign,Y={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!(1&i.__g)){i.__g|=4;try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=8&i.__g),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),o=8&i.__g),o)return void(i.__g|=2)}catch(t){e=t}}throw Un=0,e}},Bn=0,vn.prototype.setState=function(e,t){var n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=$n({},this.state);typeof e==`function`&&(e=e($n({},n),this.props)),e&&$n(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),xn(this))},vn.prototype.forceUpdate=function(e){this.__v&&(this.__g|=4,e&&this.__h.push(e),xn(this))},vn.prototype.render=_n,Vn=[],Un=0,Wn=function(e,t){return e.__v.__b-t.__v.__b},Gn=/(PointerCapture)$|Capture$/i,Kn=0,qn=kn(!1),Jn=kn(!0)})))()}function X(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c&&typeof e!=`function`)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--tr,__i:-1,__u:0,__source:i,__self:a};return Y.vnode&&Y.vnode(l),l}var tr;function nr(){return(nr=e((()=>{er(),tr=0,Array.isArray})))()}function rr({name:e,remappedFrom:t,token:n,width:r,height:i,viewBox:a,label:o,alignCapitals:s=!1}){"use no memo";let c=`#${e.replace(/^#/,``)}`,{width:l,height:u,viewBox:d}=or[e]??{width:ir,height:ar},f=r??l,p=i??u,m=a??d??`0 0 ${l} ${u}`;return X(`svg`,{"data-icon-name":t??e,"data-icon-token":n,"data-align-capitals":s,...o==null?{"aria-hidden":!0}:{"aria-label":o,role:`img`},viewBox:m,width:f,height:p,children:X(`use`,{href:c})})}var ir,ar,or;function sr(){return(sr=e((()=>{nr(),ir=16,ar=16,or={}})))()}function cr({children:e,marker:t,variant:n=`default`}){"use no memo";return X(`div`,{"aria-hidden":!0,"data-truncate-marker-cell":!0,children:X(`div`,{"data-truncate-marker":!0,children:typeof t==`function`?t({children:e}):n===`fade`?X(`span`,{"data-truncate-fade":!0}):t})})}function lr(e){"use no memo";let{mode:t,children:n}=e;return X(`div`,{children:[X(`div`,{"data-truncate-content":`visible`,children:t===`fruncate`?X(`span`,{children:n}):n}),X(`div`,{"data-truncate-content":`overflow`,"aria-hidden":!0,children:t===`fruncate`?X(`span`,{children:n}):n})]})}function ur({children:e,mode:t=`truncate`,marker:n=`…`,variant:r=`default`,...i}){"use no memo";let a=X(lr,{mode:t,children:e},`content`),o=X(cr,{marker:n,mode:t,variant:r},`marker`),s=X(`div`,{"data-truncate-fill":!0},`fill`);return X(`div`,{"data-truncate-container":t,"data-truncate-variant":r,...i,children:X(`div`,{"data-truncate-grid":!0,children:t===`truncate`?[a,o]:[o,a,s]})})}function dr({children:e,...t}){"use no memo";return X(ur,{mode:`truncate`,...t,children:e})}function fr({children:e,...t}){"use no memo";return X(ur,{mode:`fruncate`,...t,children:e})}function pr({children:e,contents:t,priority:n=`end`,split:r=`center`,minimumLength:i=12,className:a,style:o,...s}){"use no memo";let c=null,l=null;if(Array.isArray(t)){if(t.length!==2)return console.error(`MiddleTruncate: contents must be an array of two items`),null;c=X(dr,{...s,children:t[0]}),l=X(fr,{...s,children:t[1]})}else{if(typeof e!=`string`)return console.error(`MiddleTruncate: children must be a string`),null;if(e.length===0)return X(`div`,{className:a,style:o});if(e.length<i)return X(n===`end`?fr:dr,{...s,className:a,style:o,children:e});let t=null,u=null,d=null;if(typeof r==`string`)r===`center`?t=mr:r===`extension`?t=hr:r===`leaf-path`&&(t=gr);else if(typeof r==`number`)t=_r,u=r;else if(Array.isArray(r)){let[e,n]=r;d=n,e===`last`?t=vr:e===`first`&&(t=yr)}else typeof r==`function`&&(t=r);t??=mr;let[f,p]=t(e,{priority:n,variant:s.variant,splitIndex:typeof u==`number`?u:void 0,splitOffset:typeof d==`number`?d:void 0}),m=f.length>=p.length,h=n===`equal`&&!m,g=n===`equal`&&m,_={},v={};h&&(_.marker=``),g&&(v.marker=``),c=X(dr,{...s,..._,children:f}),l=X(fr,{...s,...v,children:p})}return X(`div`,{"data-truncate-group-container":`middle`,className:a,style:o,children:[X(`div`,{"data-truncate-segment-priority":n===`start`||n===`equal`?`1`:`2`,children:c}),X(`div`,{"data-truncate-segment-priority":n===`end`||n===`equal`?`1`:`2`,children:l})]})}var mr,hr,gr,_r,vr,yr;function br(){return(br=e((()=>{nr(),mr=e=>{if(e.length<2)return[e,``];let t=Math.ceil(e.length/2);return[e.slice(0,t),e.slice(t)]},hr=e=>{if(e.length<4)return[e,``];let t=e.lastIndexOf(`.`)+1,n=e.length-t>10,r=t>=1&&!n?t:Math.ceil(e.length/2);return[e.slice(0,r),e.slice(r)]},gr=e=>{if(e.length<4)return[e,``];let t=e.lastIndexOf(`/`)+1,n=e.length-t>25,r=t>=1&&!n?t:Math.ceil(e.length/2);return[e.slice(0,r),e.slice(r)]},_r=(e,{splitIndex:t}={})=>{if(typeof t!=`number`){let t=Math.ceil(e.length/2);return[e.slice(0,t),e.slice(t)]}return[e.slice(0,t),e.slice(t)]},vr=(e,{splitOffset:t}={})=>{if(typeof t!=`number`||t<=0||t>=e.length){let t=Math.ceil(e.length/2);return[e.slice(0,t),e.slice(t)]}let n=e.length-t;return[e.slice(0,n),e.slice(n)]},yr=(e,{splitOffset:t}={})=>{if(typeof t!=`number`||t<=0||t>=e.length){let t=Math.ceil(e.length/2);return[e.slice(0,t),e.slice(t)]}let n=t;return[e.slice(0,n),e.slice(n)]}})))()}function xr(e,t,n){return Math.min(Math.max(e,t),n)}function Sr(e,t){return e<0||t<e?Mr:{endIndex:t,startIndex:e}}function Cr(e){return e.startIndex<0||e.endIndex<e.startIndex}function wr(e,t){return Cr(e)?0:(e.endIndex-e.startIndex+1)*t}function Tr(e,t,n){if(t<=0)return-1;let r=t*n;return e<=0?0:e>=r?t:Math.floor(e/n)}function Er(e,t,n){return t<=0||e<=0?-1:e>=t*n?t-1:Math.ceil(e/n)-1}function Dr(e){let t=new Map;return e.forEach((e,n)=>{if(e.kind!==`directory`||!e.isExpanded)return;let r=e.ancestorPaths.length,i=t.get(r);if(i==null){t.set(r,[n]);return}i.push(n)}),t}function Or(e,t){let n=0,r=e.length-1,i=-1;for(;n<=r;){let a=Math.floor((n+r)/2),o=e[a];if(o==null)break;if(o<=t){i=a,n=a+1;continue}r=a-1}return i}function kr(e){let t=new Map,n=[];for(let r=0;r<e.length;r+=1){let i=e[r];if(i==null)continue;let a=i.kind===`directory`&&i.isExpanded?[...i.ancestorPaths,i.path]:i.ancestorPaths,o=0;for(;o<n.length&&o<a.length&&n[o]===a[o];)o+=1;for(let e=n.length-1;e>=o;--e){let i=n[e];i!=null&&t.set(i,r-1)}n.length=o;for(let e=o;e<a.length;e+=1){let t=a[e];t!=null&&n.push(t)}}let r=e.length-1;for(let e of n)t.set(e,r);return t}function Ar(e,t,n){if(e.length===0||t<=0)return[];let r=kr(e),i=Dr(e),a=[];for(let r=0;r<e.length;r+=1){let o=i.get(r);if(o==null||o.length===0)break;let s=t+r*n,c=Or(o,Math.min(e.length-1,Math.floor(s/n))),l=null;for(;c>=0;){let t=o[c],n=t==null?null:e[t]??null;if(n!=null&&(r===0||n.ancestorPaths[r-1]===a[r-1]?.path)){l=n;break}--c}if(l==null)break;a.push(l)}return a.map((i,a)=>{let o=a*n,s=(r.get(i.path)??e.length-1)+1;if(s>=e.length)return{row:i,top:o};let c=s*n-t;return{row:i,top:Math.min(o,c-n)}}).filter(e=>e.top+n>0)}function jr(e,t){let n=t.totalRowCount??e.length,r=n*t.itemHeight,i=Math.max(0,t.viewportHeight),a=Math.max(0,Math.floor(t.overscan)),o=Math.max(0,r-i),s=xr(t.scrollTop,0,o),c=t.stickyRows??Ar(e,s,t.itemHeight),l=c.reduce((e,n)=>Math.max(e,n.top+t.itemHeight),0),u=Math.min(r,s+l),d=Math.max(0,i-l),f=Math.max(0,r-u),p=Tr(s,n,t.itemHeight),m=Tr(u,n,t.itemHeight),h=l<=0||p<0||p>=n?-1:p,g=h===-1?-1:Math.min(n-1,m-1),_=h===-1||g<h?0:g-h+1,v=d<=0||m>=n?Mr:Sr(m,Er(u+d,n,t.itemHeight)),y=g+1,b=Cr(v)?Mr:Sr(Math.max(y,v.startIndex-a),Math.min(n-1,v.endIndex+a)),x=wr(b,t.itemHeight);return{occlusion:{firstOccludedIndex:h,lastOccludedIndex:g,occludedCount:_},physical:{itemHeight:t.itemHeight,maxScrollTop:o,overscan:a,scrollTop:s,totalHeight:r,totalRowCount:n,viewportHeight:i},projected:{contentHeight:f,paneHeight:d,paneTop:u},sticky:{height:l,rows:c},visible:v,window:{endIndex:b.endIndex,height:x,offsetTop:Cr(b)?0:b.startIndex*t.itemHeight,startIndex:b.startIndex}}}var Mr;function Nr(){return(Nr=e((()=>{Mr={endIndex:-1,startIndex:-1}})))()}var Pr,Fr,Ir;function Lr(){return(Lr=e((()=>{Pr={added:`A`,deleted:`D`,ignored:null,modified:`M`,renamed:`R`,untracked:`U`},Fr={added:`Git status: added`,deleted:`Git status: deleted`,ignored:`Git status: ignored`,modified:`Git status: modified`,renamed:`Git status: renamed`,untracked:`Git status: untracked`},Ir=`Contains git status items`})))()}function Rr(e){let{currentScrollTop:t,focusedIndex:n,itemHeight:r,topInset:i=0,viewportHeight:a}=e;if(n<0)return null;let o=Math.max(0,i),s=n*r,c=s+r;if(s<t+o){let e=Math.max(0,s-o);return e===t?null:e}if(c>t+a){let e=c-a;return e===t?null:e}return null}function zr(e){let{currentScrollTop:t,focusedIndex:n,itemHeight:r,offset:i,topInset:a=0,totalHeight:o,viewportHeight:s}=e;if(i===`nearest`)return Rr({currentScrollTop:t,focusedIndex:n,itemHeight:r,topInset:a,viewportHeight:s});if(n<0)return null;let c=Math.max(0,a),l=n*r,u=Math.max(0,s-c),d=i===`center`?c+Math.max(0,(u-r)/2):c,f=Math.max(0,o-s),p=Math.max(0,Math.min(l-d,f));return p===t?null:p}function Br(e){let{currentScrollTop:t,focusedIndex:n,itemHeight:r,targetViewportOffset:i,totalHeight:a,viewportHeight:o}=e;if(n<0)return null;let s=Math.max(0,i),c=n*r,l=c+r,u=t+s,d=t+o;if(c>=u&&l<=d)return null;let f=Math.max(0,a-o),p=Math.max(0,Math.min(c-s,f));return p===t?null:p}function Vr(e){if(e==null||!e.isConnected||e===document.body||e===document.documentElement)return!1;e.focus({preventScroll:!0});let t=e.getRootNode();return t instanceof ShadowRoot?t.activeElement===e:document.activeElement===e}function Hr(e){let t=e.getRootNode();if(t instanceof ShadowRoot){let e=t.activeElement;return e instanceof HTMLElement?e:null}let n=document.activeElement;return n instanceof HTMLElement&&e.contains(n)?n:null}function Ur(e,t){if(e==null)return t;let n=e.getBoundingClientRect().height;return n>0?n:e.clientHeight>0?e.clientHeight:t}function Wr(e,t){return e!=null&&e>0?e:t}function Gr(e){let t=e.borderBoxSize,n=Array.isArray(t)?t[0]:t;return n!=null&&Number.isFinite(n.blockSize)&&n.blockSize>0?n.blockSize:e.contentRect.height>0?e.contentRect.height:null}function Kr(e,t,n,r,i=0){let a=Rr({currentScrollTop:e.scrollTop,focusedIndex:t,itemHeight:n,topInset:i,viewportHeight:r});return a!=null&&(e.scrollTop=a,!0)}function qr(e,t,n,r,i,a,o=0){let s=zr({currentScrollTop:e.scrollTop,focusedIndex:t,itemHeight:n,offset:a,topInset:o,totalHeight:i,viewportHeight:r});return s!=null&&(e.scrollTop=s,!0)}function Jr(e,t,n,r,i,a){let o=Br({currentScrollTop:e.scrollTop,focusedIndex:t,itemHeight:n,targetViewportOffset:a,totalHeight:i,viewportHeight:r});return o!=null&&(e.scrollTop=o,!0)}function Yr(e,t,n,r){return n.end<n.start?null:e<n.start?-t:e>n.end?r:null}function Xr(){return(Xr=e((()=>{})))()}function Zr(e){let{renamingPath:t,previousRenamingPath:n,hasRenderedInput:r}=e;return t==null?`reset`:r?n===t?`ignore`:`focus-input`:`reveal-canonical`}function Qr({ariaLabel:e,isFlattened:t=!1,ref:n,value:r,onBlur:i,onInput:a}){return X(`input`,{ref:n,"data-item-rename-input":!0,...t?{"data-item-flattened-rename-input":!0}:{},"aria-label":e,value:r,onBlur:i,onInput:a,onClick:e=>e.stopPropagation(),onMouseDown:e=>e.stopPropagation(),onPointerDown:e=>e.stopPropagation()})}function $r(){return($r=e((()=>{nr()})))()}function ei(e){let{row:t,mode:n,targetPath:r,ariaLabel:i,domId:a,isParked:o,itemHeight:s,features:c,state:l,extraStyle:u}=e,d=n===`sticky`,f=t.ancestorPaths.at(-1)??``,p={};return l.isFocusRinged&&(p[`data-item-focused`]=!0),t.isSelected&&(p[`data-item-selected`]=!0),l.isContextHovered&&(p[`data-item-context-hover`]=`true`),l.isDragTarget&&(p[`data-item-drag-target`]=!0),l.isDragging&&(p[`data-item-dragging`]=!0),l.effectiveGitStatus!=null&&(p[`data-item-git-status`]=l.effectiveGitStatus),l.containsGitChange&&(p[`data-item-contains-git-change`]=`true`),{"aria-expanded":!d&&t.kind===`directory`?t.isExpanded:void 0,"aria-haspopup":c.contextMenuEnabled?`menu`:void 0,"aria-label":i,"aria-level":d?void 0:t.level+1,"aria-posinset":d?void 0:t.posInSet+1,"aria-selected":d?void 0:t.isSelected?`true`:`false`,"aria-setsize":d?void 0:t.setSize,"data-file-tree-sticky-path":d?r:void 0,"data-file-tree-sticky-row":d?`true`:void 0,"data-item-context-menu-button-visibility":c.actionLaneEnabled?c.contextMenuButtonVisibility:void 0,"data-item-context-menu-trigger-mode":c.contextMenuEnabled?c.contextMenuTriggerMode:void 0,"data-item-has-context-menu-action-lane":c.actionLaneEnabled?`true`:void 0,"data-item-has-git-lane":c.gitLaneActive?`true`:void 0,"data-item-parent-path":f.length>0?f:void 0,"data-item-parked":o?`true`:void 0,"data-item-path":r,"data-item-type":t.kind===`directory`?`folder`:`file`,"data-type":`item`,id:d?void 0:a,role:d?void 0:`treeitem`,style:{minHeight:`${s}px`,...u},tabIndex:!d&&t.isFocused?0:-1,...p}}function ti(e){let{event:t,mode:n,isSearchOpen:r,isDirectory:i}=e,a=t.ctrlKey||t.metaKey,o=t.shiftKey||a,s=t.shiftKey?{additive:a,kind:`range`}:a?{kind:`toggle`}:{kind:`single`};return{closeSearch:r,revealCanonical:n===`sticky`,selection:s,toggleDirectory:!o&&i}}function ni(e,t){$.__h&&$.__h(Q,e,yi||t),yi=0;var n=Q.__H||(Q.__H={__:[],__h:[]});return e>=n.__.length&&n.__.push({}),n.__[e]}function ri(e){return yi=1,ii(mi,e)}function ii(e,t,n){var r=ni(hi++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):mi(void 0,t),function(e){var t=r.__N?r.__N[0]:r.__[0],n=r.t(t,e);vi(t,n)||(r.__N=[n,r.__[1]],r.__c.setState({}))}],r.__c=Q,!Q.__f)){var i=function(e,t,n){if(!r.__c.__H)return!0;var i=r.__c.__H.__.filter(function(e){return!!e.__c});if(i.every(function(e){return!e.__N}))return!a||a.call(this,e,t,n);var o=r.__c.props!==e;return i.forEach(function(e){if(e.__N){var t=e.__[0];e.__=e.__N,e.__N=void 0,vi(t,e.__[0])||(o=!0)}}),a&&a.call(this,e,t,n)||o};Q.__f=!0;var a=Q.shouldComponentUpdate,o=Q.componentWillUpdate;Q.componentWillUpdate=function(e,t,n){if(4&this.__g){var r=a;a=void 0,i(e,t,n),a=r}o&&o.call(this,e,t,n)},Q.shouldComponentUpdate=i}return r.__N||r.__}function ai(e,t){var n=ni(hi++,3);!$.__s&&pi(n.__H,t)&&(n.__=e,n.u=t,Q.__H.__h.push(n))}function oi(e,t){var n=ni(hi++,4);!$.__s&&pi(n.__H,t)&&(n.__=e,n.u=t,Q.__h.push(n))}function Z(e){return yi=5,si(function(){return{current:e}},[])}function si(e,t){var n=ni(hi++,7);return pi(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function ci(e,t){return yi=8,si(function(){return e},t)}function li(){for(var e;e=bi.shift();)if(e.__P&&e.__H)try{e.__H.__h.forEach(di),e.__H.__h.forEach(fi),e.__H.__h=[]}catch(t){e.__H.__h=[],$.__e(t,e.__v)}}function ui(e){var t,n=function(){clearTimeout(r),Di&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);Di&&(t=requestAnimationFrame(n))}function di(e){var t=Q,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),Q=t}function fi(e){var t=Q;e.__c=e.__(),Q=t}function pi(e,t){return!e||e.length!==t.length||t.some(function(t,n){return!vi(t,e[n])})}function mi(e,t){return typeof t==`function`?t(e):t}var hi,Q,gi,_i,vi,yi,bi,$,xi,Si,Ci,wi,Ti,Ei,Di;function Oi(){return(Oi=e((()=>{er(),vi=Object.is,yi=0,bi=[],$=Y,xi=$.__b,Si=$.__r,Ci=$.diffed,wi=$.__c,Ti=$.unmount,Ei=$.__,$.__b=function(e){Q=null,xi&&xi(e)},$.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Ei&&Ei(e,t)},$.__r=function(e){Si&&Si(e),hi=0;var t=(Q=e.__c).__H;t&&(gi===Q?(t.__h=[],Q.__h=[],t.__.forEach(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.forEach(di),t.__h.forEach(fi),t.__h=[],hi=0)),gi=Q},$.diffed=function(e){Ci&&Ci(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(bi.push(t)!==1&&_i===$.requestAnimationFrame||((_i=$.requestAnimationFrame)||ui)(li)),t.__H.__.forEach(function(e){e.u&&(e.__H=e.u),e.u=void 0})),gi=Q=null},$.__c=function(e,t){t.some(function(e){try{e.__h.forEach(di),e.__h=e.__h.filter(function(e){return!e.__||fi(e)})}catch(n){t.some(function(e){e.__h&&=[]}),t=[],$.__e(n,e.__v)}}),wi&&wi(e,t)},$.unmount=function(e){Ti&&Ti(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.forEach(function(e){try{di(e)}catch(e){t=e}}),n.__H=void 0,t&&$.__e(t,n.__v))},Di=typeof requestAnimationFrame==`function`})))()}function ki(e,t=null,n=null){"use no memo";let r=e.flattenedSegments;return r==null||r.length===0?t??e.name:X(`span`,{"data-item-flattened-subitems":!0,children:r.map((e,i)=>{let a=i===r.length-1;return X(_n,{children:[X(`span`,{"data-item-flattened-subitem":e.path,"data-item-flattened-subitem-drag-target":n===e.path?`true`:void 0,children:a&&t!=null?t:X(dr,{children:e.name})}),i<r.length-1?` / `:``]},e.path)})})}function Ai(e){return e.isFlattened?e.flattenedSegments?.findLast(e=>e.isTerminal)?.path??e.path:e.path}function ji(e){let t=e.flattenedSegments;return t==null||t.length===0?e.name:t.map(e=>e.name).join(` / `)}function Mi(e,t,n,r){return e.map((e,i)=>{let a=i*n,o=e.subtreeEndIndex+1;if(o>=r)return{row:e.row,top:a};let s=o*n-t;return{row:e.row,top:Math.min(a,s-n)}}).filter(e=>e.top+n>0)}function Ni({controller:e,itemHeight:t,overscan:n,scrollTop:r,stickyFolders:i,viewportHeight:a}){let o=e.getVisibleCount(),s=i&&o>0?e.getStickyRowCandidates(r,t):[],c=s==null&&i&&o>0?e.getVisibleRows(0,o-1):[],l=jr(c,{itemHeight:t,overscan:n,scrollTop:r,stickyRows:s==null?void 0:Mi(s,r,t,o),totalRowCount:o,viewportHeight:a}),u=i&&r<=0&&o>0?e.getStickyRowCandidates(1,t):[],d=u!=null&&r<=0?Mi(u,1,t,o):i&&r<=0&&c.length>0?Ar(c,1,t):l.sticky.rows;return{overlayHeight:d.reduce((e,n)=>Math.max(e,n.top+t),0),overlayRows:d,snapshot:l,visibleRows:c}}function Pi(e,t,n){let r=e,i=document.elementFromPoint?.bind(document)??null,a=r.elementFromPoint?.(t,n)??i?.(t,n)??null;return e instanceof ShadowRoot&&(a==null||!e.contains(a))?Fi(e,t,n):a instanceof HTMLElement?a:null}function Fi(e,t,n){let r=Array.from(e.querySelectorAll(`[data-type="item"], [data-item-flattened-subitem]`));for(let e=r.length-1;e>=0;e--){let i=r[e],a=i.getBoundingClientRect();if(t>=a.left&&t<=a.right&&n>=a.top&&n<=a.bottom)return i}return null}function Ii(e){let t=e?.closest?.(`[data-type="item"]`);if(!(t instanceof HTMLElement))return null;let n=t.dataset.itemPath??null;if(n==null)return null;let r=e?.closest?.(`[data-item-flattened-subitem]`),i=r instanceof HTMLElement?r.getAttribute(`data-item-flattened-subitem`)??null:null;if(i!=null&&i.endsWith(`/`))return{directoryPath:i,flattenedSegmentPath:i,hoveredPath:n,kind:`directory`};if(t.dataset.itemType===`folder`)return{directoryPath:n,flattenedSegmentPath:null,hoveredPath:n,kind:`directory`};let a=t.dataset.itemParentPath??null;return a==null||a.length===0?{directoryPath:null,flattenedSegmentPath:null,hoveredPath:n,kind:`root`}:{directoryPath:a,flattenedSegmentPath:null,hoveredPath:n,kind:`directory`}}function Li(e){let t=e.cloneNode(!0);return t.removeAttribute(`id`),t.dataset.fileTreeDragPreview=`true`,t.setAttribute(`aria-hidden`,`true`),t.tabIndex=-1,Object.assign(t.style,{boxShadow:`0 4px 12px rgba(0, 0, 0, 0.15)`,left:`0px`,margin:`0`,pointerEvents:`none`,position:`fixed`,top:`0px`,willChange:`transform`,zIndex:`10000`}),t}function Ri(){return navigator.vendor!==`Apple Computer, Inc.`}function zi(e,t){let n=e-t.top;if(n<ma)return-Math.ceil((ma-Math.max(0,n))/ma*ha);let r=t.bottom-e;return r<ma?Math.ceil((ma-Math.max(0,r))/ma*ha):0}function Bi(e,t){if(e!=null){let t=Pr[e];return t==null?null:{text:t,title:Fr[e]}}return t?{icon:{name:`file-tree-icon-dot`,width:6,height:6},title:Ir}:null}function Vi(e,t,n){if(t==null||t.size===0)return null;let r=[];for(let i=e.length-1;i>=0;--i){let a=e[i],o=n.get(a);if(o!=null){for(let e of r)n.set(e,o);return o?`ignored`:null}if(t.has(a)){n.set(a,!0);for(let e of r)n.set(e,!0);return`ignored`}r.push(a)}for(let e of r)n.set(e,!1);return null}function Hi(e){return e!=null&&`toggle`in e}function Ui(e){return e.code===`Space`||e.key===` `||e.key===`Spacebar`}function Wi(e){return e.key.length===1&&/^[\p{L}\p{N}]$/u.test(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey}function Gi(e){return e==null?``:`[data-item-section="spacing-item"][data-ancestor-path="${e.replaceAll(`\\`,`\\\\`).replaceAll(`"`,`\\"`)}"] { opacity: 1; }`}function Ki(e){return e.shiftKey&&e.key===`F10`||e.key===`ContextMenu`}function qi(e,t){return t&&Ki(e)||(e.ctrlKey||e.metaKey)&&Ui(e)?!0:e.key===`ArrowDown`||e.key===`ArrowLeft`||e.key===`ArrowRight`||e.key===`ArrowUp`}function Ji(e){for(let t of e.composedPath())if(t instanceof HTMLElement&&(t.dataset.fileTreeContextMenuRoot===`true`||t.dataset.type===`context-menu-anchor`||t.dataset.type===`context-menu-trigger`||t.getAttribute(`slot`)===`context-menu`))return!0;return!1}function Yi(e){return{bottom:e.bottom,height:e.height,left:e.left,right:e.right,top:e.top,width:e.width,x:e.x,y:e.y}}function Xi(e,t){return{bottom:t,height:0,left:e,right:e,top:t,width:0,x:e,y:t}}function Zi(e,t){if(e==null)return t.offsetTop;let n=t.getBoundingClientRect(),r=e.getBoundingClientRect();return n.top-r.top}function Qi(e,t,n){if(n==null){e.delete(t);return}e.set(t,n)}function $i(e,t,n){if(e==null)return null;let r=t.get(e)??null;if(r!=null)return r;let i=n.get(e)??null;return i?.dataset.itemParked===`true`?null:i}function ea(e){if(e==null)return[];let t=[];for(let n of e.querySelectorAll(`button[data-file-tree-sticky-row="true"]`)){if(!(n instanceof HTMLElement))continue;let e=n.dataset.fileTreeStickyPath;e!=null&&t.push(e)}return t}function ta(e,t){if(e==null||t==null)return null;for(let n of e.querySelectorAll(`button[data-item-focused="true"][data-item-parked="true"]`))if(n instanceof HTMLElement&&n.dataset.itemPath===t)return n;return null}function na(e,t,n,r,i,a,o){let s=Math.max(0,a-i),c=t?.getBoundingClientRect()??null,l=c==null||n==null?null:n.getBoundingClientRect().top-c.top,u=ta(e,r),d=c==null||u==null?null:u.getBoundingClientRect().top-c.top;return Math.max(0,Math.min(d??Math.max(l??0,s),Math.max(0,o-i)))}function ra(e,t){return{kind:e.kind,name:ji(e),path:t}}function ia(e){return e==null?void 0:`${e}__tree`}function aa(e,t,n){if(e!=null)return`${e}__focused-item-${encodeURIComponent(t)}${n?`__parked`:``}`}function oa(e){return e===`file-tree-icon-chevron`||e===`file-tree-icon-dot`||e===`file-tree-icon-file`||e===`file-tree-icon-lock`}function sa(e,t){if(e==null)return null;if(`text`in e)return X(`span`,{title:e.title,children:e.text});let n=typeof e.icon==`string`?oa(e.icon)?t(e.icon):{name:e.icon}:oa(e.icon.name)?(()=>{let n=t(e.icon.name),{name:r,...i}=e.icon;return{...n,...i}})():e.icon;return X(`span`,{title:e.title,children:X(rr,{...n})})}function ca(e){e!=null&&Vr(e.querySelector([`button:not([disabled])`,`[href]`,`input:not([disabled])`,`select:not([disabled])`,`textarea:not([disabled])`,`[tabindex]:not([tabindex="-1"])`].join(`, `))??e)}function la(e,t,{actionLaneEnabled:n=!1,customDecoration:r=null,decorationLaneEnabled:i=!1,dragTargetFlattenedSegmentPath:a=null,gitDecoration:o=null,gitLaneActive:s=!1,renameInput:c=null,showDecorativeActionAffordance:l=!1}={}){let u=Ai(e);return X(_n,{children:[e.depth>0?X(`div`,{"data-item-section":`spacing`,children:Array.from({length:e.depth}).map((t,n)=>X(`div`,{"data-item-section":`spacing-item`,"data-ancestor-path":e.ancestorPaths[n]},n))}):null,X(`div`,{"data-item-section":`icon`,children:e.kind===`directory`?X(rr,{...t(`file-tree-icon-chevron`)}):X(rr,{...t(`file-tree-icon-file`,u)})}),X(`div`,{"data-item-section":`content`,children:e.isFlattened?ki(e,c,a):c??X(pr,{minimumLength:5,split:`extension`,children:e.name})}),i?X(`div`,{"data-item-section":`decoration`,children:r==null?null:sa(r,t)}):null,s?X(`div`,{"data-item-section":`git`,children:sa(o,t)}):null,n?X(`div`,{"data-item-section":`action`,children:l?X(`span`,{"aria-hidden":`true`,"data-item-action-affordance":`decorative`,children:X(rr,{...t(`file-tree-icon-ellipsis`)})}):null}):null]})}function ua(e,t,n,r={}){let{controller:i,renameView:a,visualFocusPath:o,contextHoverPath:s,draggedPathSet:c,dragTarget:l,dragAndDropEnabled:u,shouldSuppressContextMenu:d,handleRowDragStart:f,handleRowDragEnd:p,handleRowTouchStart:m,instanceId:h,itemHeight:g,gitStatusByPath:_,ignoredGitDirectories:v,ignoredInheritanceCache:y,directoriesWithGitChanges:b,gitLaneActive:x,contextMenuEnabled:S,contextMenuTriggerMode:C,contextMenuButtonTriggerEnabled:w,contextMenuButtonVisibility:T,contextMenuRightClickEnabled:E,registerRenameInput:D,registerButton:O,resolveIcon:k,renderDecorationForRow:A,openContextMenuForRow:j,onRowClick:M,onKeyDown:N}=e,P=Ai(t),{isParked:F=!1,mode:ee=`flow`,style:te}=r,ne=ee===`sticky`,re=_?.get(P)??null??Vi(t.ancestorPaths,v,y),ie=t.kind===`directory`&&(b?.has(P)??!1),ae=A(t,P),oe=Bi(re,ie),I=S&&w,se=ae!=null||x||I,ce=I&&T===`always`,L=a.getPath()===P,le=L?a.getValue():``,R=ne||!L?null:X(Qr,{ref:D,ariaLabel:`Rename ${ji(t)}`,isFlattened:t.isFlattened,value:le,onBlur:()=>{a.commit()},onInput:e=>{a.setValue(e.currentTarget.value)}}),z=la(t,k,{actionLaneEnabled:I,customDecoration:ae,decorationLaneEnabled:se,dragTargetFlattenedSegmentPath:l?.flattenedSegmentPath??null,gitDecoration:oe,gitLaneActive:x,renameInput:R,showDecorativeActionAffordance:ce}),ue={...ei({ariaLabel:ji(t),domId:t.isFocused?aa(h,P,F):void 0,extraStyle:te,features:{actionLaneEnabled:I,contextMenuButtonVisibility:I?T:null,contextMenuEnabled:S,contextMenuTriggerMode:S?C:null,gitLaneActive:x},isParked:F,itemHeight:g,mode:ee,row:t,state:{containsGitChange:ie,effectiveGitStatus:re,isContextHovered:s===P,isDragTarget:l?.kind===`directory`&&l.directoryPath===P,isDragging:c?.has(P)===!0,isFocusRinged:t.isFocused&&o===P},targetPath:P}),key:n,onContextMenu:S||u?e=>{if(d()){e.preventDefault();return}S&&(e.preventDefault(),E&&(i.focusMountedPathFromInput(P),j(t,P,{anchorRect:Xi(e.clientX,e.clientY),source:`right-click`})))}:void 0,onFocus:ne?void 0:()=>{i.focusMountedPathFromInput(P)},onKeyDown:ne?void 0:N,ref:e=>{O(P,e)}};return!ne&&L?X(`div`,{...ue,children:z}):X(`button`,{...ue,type:`button`,draggable:u&&!F,onDragEnd:u&&!F?p:void 0,onDragStart:u&&!F?e=>{f(e,t,P)}:void 0,onMouseDown:e=>{if(ne){e.preventDefault();return}i.isSearchOpen()&&e.preventDefault()},onTouchStart:u&&!F?e=>{m(e,t,P)}:void 0,onClick:e=>{M(e,t,P,ee)},children:z})}function da(e,t,n){return t.end<t.start?[]:e.controller.getVisibleRows(t.start,t.end).filter(e=>!n.has(Ai(e))).map((n,r)=>ua(e,n,t.start+r))}function fa({composition:e,controller:t,gitStatusByPath:n,ignoredGitDirectories:r,directoriesWithGitChanges:i,icons:a,instanceId:o,itemHeight:s=tt,overscan:c=10,renamingEnabled:l=!1,renderRowDecoration:u,searchBlurBehavior:d=`close`,searchEnabled:f=!1,searchFakeFocus:p=!1,slotHost:m,stickyFolders:h=!1,initialViewportHeight:g=420}){"use no memo";let _=Z(null),v=Z(null),y=Z(!1),b=Z(null),x=Z(null),S=Z(null),C=Z(null),w=Z(null),T=Z(new Map),E=Z(new Map),D=Z(()=>{}),O=Z(null),k=Z(0),A=Z(!1),j=Z(null);j.current!==t&&(A.current=!1,j.current=t);let M=Z(!1),N=Z(null),P=Z(null),F=Z(!1),ee=Z(null),te=Z(null),ne=Z(null),re=Z(null),ie=Z(null),ae=Z(null),oe=Z(null),I=Z(null),se=Z(!1),ce=Z(null),L=Z(null),le=Z(null),R=Z(null),z=si(()=>new Map,[]),[,ue]=ri(0),[de,fe]=ri(null),[pe,me]=ri(null),[he,ge]=ri(null),[_e,ve]=ri(null),[ye,be]=ri(0),[B,xe]=ri(null),Se=Z(B);Se.current=B;let Ce=Z(null),we=Z(null),Te=Z(null),Ee=Z(null),De=Z(null),Oe=Z(!1),ke=()=>{we.current=null,Te.current=null,Ee.current=null},Ae=(e,t)=>{we.current=e,Te.current=null,Ee.current=t==null?null:{path:e,scrollTop:t}},Me=(e,t)=>{we.current=null,Te.current={path:e,viewportOffset:t},Ee.current=null},V=Z(d===`retain`&&t.isSearchOpen()),[Ne,Pe]=ri(p);ai(()=>{p||Pe(!1)},[p]);let Fe=Z(!1),Ie=ci(()=>{Fe.current=!0,Pe(e=>e&&!1)},[]),[Le,Re]=ri(()=>Ni({controller:t,itemHeight:s,overscan:c,scrollTop:0,stickyFolders:h,viewportHeight:g})),[ze,Be]=ri(!1);ai(()=>{Be(!0)},[]);let H=e?.contextMenu?.enabled===!0||e?.contextMenu?.render!=null||e?.contextMenu?.onOpen!=null||e?.contextMenu?.onClose!=null,We=e?.contextMenu?.triggerMode??(H?`right-click`:`both`),Ge=We===`both`||We===`button`,Ke=e?.contextMenu?.buttonVisibility??`when-needed`,qe=We===`both`||We===`right-click`;oi(()=>{let e=S.current;if(e==null)return;let t=e=>{if(!(e instanceof CustomEvent))return;let t=e.detail?.path??null;De.current=t,me(t),ve(t==null?null:`pointer`)},n=e=>{e instanceof CustomEvent&&(Oe.current=e.detail?.disabled===!0)};return e.addEventListener(`file-tree-debug-set-context-menu-trigger`,t),e.addEventListener(`file-tree-debug-set-scroll-suppression`,n),()=>{e.removeEventListener(`file-tree-debug-set-context-menu-trigger`,t),e.removeEventListener(`file-tree-debug-set-scroll-suppression`,n)}},[]);let Je=ci((e,t)=>{Qi(T.current,e,t)},[]),Ye=ci((e,t)=>{Qi(E.current,e,t)},[]),U=ci(e=>{x.current=e},[]),W=ci(e=>$i(e,E.current,T.current),[]),Xe=n!=null||r!=null||i!=null,{resolveIcon:Ze}=si(()=>je(a),[a]),Qe=t[tn](),$e=Qe.getPath(),et=$e!=null,nt=t.isSearchOpen(),rt=t.getSearchValue(),G=t.getFocusedPath(),K=t.getFocusedIndex(),it=t.getScrollRequest(),at=t.isDragAndDropEnabled(),ot=t.getDragSession(),st=si(()=>ot==null?null:new Set(ot.draggedPaths),[ot]),ct=ot?.target??null,lt=ot?.primaryPath??null,ut=ia(o),{overlayHeight:dt,overlayRows:ft,snapshot:q,visibleRows:pt}=Le,J=q.physical.viewportHeight,mt=si(()=>({end:q.window.endIndex,start:q.window.startIndex}),[q.window.endIndex,q.window.startIndex]),ht=ft,gt=q.sticky.rows,_t=q.physical.totalHeight,vt=q.sticky.height,yt=si(()=>new Set(gt.map(e=>Ai(e.row))),[gt]),bt=K>=0&&K>=mt.start&&K<=mt.end,xt=ci((e,t)=>u?.({item:ra(e,t),row:e})??null,[u]),St=ci(e=>Vr(e==null?null:T.current.get(e)??null)?!0:Vr(S.current),[]),Ct=ci(e=>{St(t.focusNearestPath(e))},[t,St]),wt=Z(Ct);wt.current=Ct;let Tt=Z(!0),Et=Z(()=>{}),Dt=ci((t=!0)=>{let n=Se.current;n!=null&&(Tt.current=Tt.current&&t,xe(null),e?.contextMenu?.onClose?.(),Tt.current&&Ct(n.path))},[e?.contextMenu,Ct]);Et.current=Dt;let Ot=ci(e=>{let t=e==null?null:Zi(S.current,e);ge(e=>e===t?e:t)},[]),kt=ci((e,n,r)=>{let i=t.getItem(n);if(i==null)return;let a=W(n);if(a?.dataset.fileTreeStickyRow===`true`){let e=C.current;Ae(n,e?.scrollTop??null),M.current=!0,fe(e=>e===n?e:n)}i.focus(),Ot(a),Tt.current=!0,xe({anchorRect:r?.anchorRect??null,item:ra(e,n),path:n,source:r?.source??`keyboard`})},[t,W,Ot]),At=ci(e=>{if(l){if(t.isSearchOpen()){let e=C.current,t=Ur(e,J);ee.current=K<0||e==null?null:Math.max(0,Math.min(K*s-e.scrollTop,Math.max(0,t-s))),F.current=!0}t.startRenaming(e)!==!1&&(ve(`focus`),ue(e=>e+1))}},[t,K,s,l,J]),jt=ci((e,{restoreTreeFocus:n=!0,targetOffset:r=`live-overlay`}={})=>{let i=C.current;if(i==null)return!1;t.focusPath(e);let a=t.getFocusedIndex();if(a<0)return!1;let o=t.getVisibleRows(a,a)[0]??null;if(o==null)return!1;let l=Ur(i,J),u=t.getVisibleCount()*s,d=r===`sticky-parents`?o.ancestorPaths.length*s:Ni({controller:t,itemHeight:s,overscan:c,scrollTop:i.scrollTop,stickyFolders:h,viewportHeight:l}).snapshot.sticky.height;return M.current=!0,Jr(i,a,s,l,u,d),D.current(),Ce.current=n?e:null,!0},[t,s,c,J,h]),Mt=()=>y.current===!0||R.current!=null||se.current===!0,Nt=e=>typeof window.requestAnimationFrame==`function`?window.requestAnimationFrame(()=>{e()}):window.setTimeout(e,16),Pt=e=>{if(e!=null){if(typeof window.cancelAnimationFrame==`function`){window.cancelAnimationFrame(e);return}window.clearTimeout(e)}},Ft=()=>{re.current!=null&&(clearTimeout(re.current),re.current=null),ne.current=null},It=()=>{ae.current?.remove(),ae.current=null},Lt=()=>{Pt(te.current),te.current=null,ie.current=null},Rt=e=>{let t=S.current?.getRootNode();if(t instanceof ShadowRoot){t.append(e);return}document.body.append(e)},zt=()=>{I.current?.(),I.current=null,R.current!=null&&(clearTimeout(R.current),R.current=null),se.current=!1,ce.current=null,le.current=null,L.current!=null&&(L.current.setAttribute(`draggable`,`true`),L.current.style.removeProperty(`touch-action`),L.current=null),It(),Ft(),Lt(),oe.current=null},Bt=(e,n)=>{let r=S.current?.getRootNode(),i=Ii(Pi(r instanceof ShadowRoot?r:document,e,n));return t.setDragTarget(i),t.getDragSession()?.target??null},Vt=e=>{let n=t.getDragAndDropConfig()?.openOnDropDelay??800;if(e==null||e.kind!==`directory`||e.directoryPath==null||n<=0){Ft();return}let r=t.getItem(e.directoryPath),i=Hi(r)?r:null;if(i==null||i.isExpanded()){Ft();return}let a=`${e.directoryPath}::${e.flattenedSegmentPath??``}`;ne.current!==a&&(Ft(),ne.current=a,re.current=setTimeout(()=>{let n=t.getDragSession()?.target;n?.kind===`directory`&&n.directoryPath===e.directoryPath&&n.flattenedSegmentPath===e.flattenedSegmentPath&&i.expand()},n))},Ht=()=>{te.current=null;let e=ie.current,n=C.current;if(e==null||n==null||t.getDragSession()==null)return;let r=n.getBoundingClientRect(),i=zi(e.clientY,r);if(i===0)return;let a=Math.max(0,n.scrollHeight-n.clientHeight),o=Math.max(0,Math.min(a,n.scrollTop+i));o!==n.scrollTop&&(n.scrollTop=o,D.current()),Vt(Bt(e.clientX,e.clientY)),te.current=Nt(Ht)},Ut=(e,t)=>{ie.current={clientX:e,clientY:t},te.current??=Nt(Ht)},Wt=(e,n,r)=>{let i=e.currentTarget;if(i!=null){if(zt(),It(),Ft(),Lt(),t.startDrag(r)===!1){e.preventDefault();return}if(oe.current=n,e.dataTransfer!=null&&(e.dataTransfer.effectAllowed=`move`,e.dataTransfer.dropEffect=`move`,e.dataTransfer.setData(`text/plain`,r),Ri())){let t=Li(i),n=i.getBoundingClientRect();Object.assign(t.style,{height:`${n.height}px`,opacity:`0.85`,transform:`translate3d(-9999px, 0px, 0)`,width:`${n.width}px`}),Rt(t),ae.current=t,e.dataTransfer.setDragImage(t,Math.max(0,e.clientX-n.left),Math.max(0,e.clientY-n.top))}}},Gt=()=>{It(),Ft(),Lt(),oe.current=null,t.cancelDrag()},Kt=(e,n,r)=>{if(R.current!=null||se.current)return;let i=e.touches[0],a=e.currentTarget;if(i==null||a==null)return;le.current={clientX:i.clientX,clientY:i.clientY},L.current=a,a.setAttribute(`draggable`,`false`);let o=(e={})=>{let t=e.restoreNativeDraggable??!se.current;R.current!=null&&(clearTimeout(R.current),R.current=null),document.removeEventListener(`touchmove`,s),document.removeEventListener(`touchend`,c),document.removeEventListener(`touchcancel`,c),I.current===o&&(I.current=null),t&&(a.setAttribute(`draggable`,`true`),L.current===a&&(L.current=null),le.current=null)},s=e=>{let t=e.touches[0],n=le.current;if(t==null||n==null)return;let r=t.clientX-n.clientX,i=t.clientY-n.clientY;r*r+i*i<=100||o()},c=()=>{o()};document.addEventListener(`touchmove`,s,{passive:!0}),document.addEventListener(`touchend`,c),document.addEventListener(`touchcancel`,c),I.current=o,R.current=setTimeout(()=>{if(o({restoreNativeDraggable:!1}),t.startDrag(r)===!1){a.setAttribute(`draggable`,`true`),L.current===a&&(L.current=null),le.current=null;return}se.current=!0,L.current=a,a.setAttribute(`draggable`,`false`),a.style.setProperty(`touch-action`,`none`),oe.current=n;let e=a.getBoundingClientRect(),s=Li(a);Object.assign(s.style,{height:`${e.height}px`,opacity:`0.85`,transform:`translate3d(${e.left}px, ${e.top}px, 0)`,width:`${e.width}px`}),Rt(s),ae.current=s,ce.current={x:i.clientX-e.left,y:i.clientY-e.top};let c=e=>{let t=e.touches[0];if(t==null)return;e.preventDefault();let n=ce.current;n!=null&&ae.current!=null&&(ae.current.style.transform=`translate3d(${t.clientX-n.x}px, ${t.clientY-n.y}px, 0)`),Vt(Bt(t.clientX,t.clientY)),Ut(t.clientX,t.clientY)},l=e=>{let n=e.changedTouches[0];n!=null&&Bt(n.clientX,n.clientY),t.completeDrag(),zt()},u=()=>{t.cancelDrag(),zt()};I.current=()=>{document.removeEventListener(`touchmove`,c),document.removeEventListener(`touchend`,l),document.removeEventListener(`touchcancel`,u)},document.addEventListener(`touchmove`,c,{passive:!1}),document.addEventListener(`touchend`,l),document.addEventListener(`touchcancel`,u)},pa)},qt=e=>{if(B!=null){if(e.key===`Escape`){Dt(),e.preventDefault(),e.stopPropagation();return}ga.has(e.key)&&(e.preventDefault(),e.stopPropagation());return}if(Qe.isActive()){if(e.key===`Escape`)Qe.cancel();else if(e.key===`Enter`)Qe.commit();else return;ve(`focus`),ue(e=>e+1),e.preventDefault(),e.stopPropagation();return}if(l&&e.key===`F2`){At(G??void 0),e.preventDefault(),e.stopPropagation();return}if(nt){if(e.key===`Escape`)F.current=!1,ee.current=null,t.closeSearch();else if(e.key===`Enter`){let e=t.getFocusedPath();e!=null&&t.selectOnlyPath(e);let n=C.current,r=Ur(n,J);ee.current=K<0||n==null?null:Math.max(0,Math.min(K*s-n.scrollTop,Math.max(0,r-s))),F.current=!0,t.closeSearch()}else if(e.key===`ArrowDown`)t.focusNextSearchMatch();else if(e.key===`ArrowUp`)t.focusPreviousSearchMatch();else return;ve(`focus`),ue(e=>e+1),e.preventDefault(),e.stopPropagation();return}if(f&&Wi(e)){t.openSearch(e.key),ue(e=>e+1),e.preventDefault(),e.stopPropagation();return}let n=H&&Ki(e),r=qi(e,H),i=r&&S.current!=null?Hr(S.current):null,a=r?new Set(ea(S.current)):new Set,o=i?.dataset.fileTreeStickyPath??null,c=i?.dataset.fileTreeStickyRow===`true`&&o!=null;if(c&&o!==G&&a.has(o)){let e=C.current;Ae(o,e?.scrollTop??null),t.focusPath(o)}let u=t.getFocusedPath(),d=t.getFocusedIndex(),p=t.getFocusedItem();if(p==null)return;let m=Hi(p)?p:null,h=u!=null&&(yt.has(u)||c&&o===u&&a.has(u)),g=e.key===`ArrowDown`||e.key===`ArrowUp`||e.key===`ArrowRight`&&m!=null&&m.isExpanded(),_=e.key===`ArrowLeft`&&h&&m!=null&&m.isExpanded(),v=C.current,y=!0;if(e.shiftKey&&e.key===`ArrowDown`)t.extendSelectionFromFocused(1);else if(e.shiftKey&&e.key===`ArrowUp`)t.extendSelectionFromFocused(-1);else if(n&&u!=null&&d>=0){let e=t.getVisibleRows(d,d)[0]??null,n=$i(u,E.current,T.current);e==null||n==null?y=!1:kt(e,u)}else if((e.ctrlKey||e.metaKey)&&Ui(e))t.toggleFocusedSelection();else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`a`)t.selectAllVisiblePaths();else switch(e.key){case`ArrowDown`:t.focusNextItem();break;case`ArrowUp`:t.focusPreviousItem();break;case`ArrowRight`:m==null||m.isExpanded()?t.focusNextItem():m.expand();break;case`ArrowLeft`:m!=null&&m.isExpanded()?m.collapse():t.focusParentItem();break;case`Home`:t.focusFirstItem();break;case`End`:t.focusLastItem();break;default:y=!1}if(!y)return;ve(`focus`);let b=t.getFocusedPath(),x=b!=null&&(yt.has(b)||a.has(b)),w=g&&b!==u,D=n&&c&&o===u&&b===u;if((h||D)&&b!=null&&(w&&x||D))Ae(b,v?.scrollTop??null),M.current=!0,fe(e=>e===b?e:b);else{let t=e.key===`ArrowUp`&&h&&b!==u;b!=null&&(t||_&&b===u)?(Me(b,na(S.current,v,i,u,s,vt,J)),M.current=!0,fe(e=>e===b?e:b)):ke()}ue(e=>e+1),e.preventDefault(),e.stopPropagation()};oi(()=>{if(f&&nt){if(V.current){V.current=!1;return}Vr(w.current)}},[nt,f]),oi(()=>{let e=x.current;switch(Zr({hasRenderedInput:e!=null,previousRenamingPath:P.current,renamingPath:$e})){case`reset`:P.current=null;return;case`reveal-canonical`:$e!=null&&jt($e,{restoreTreeFocus:!1,targetOffset:`live-overlay`});return;case`ignore`:return;case`focus-input`:e!=null&&(Ce.current=null,P.current=$e,Vr(e),e.select());return}},[mt.end,mt.start,$e,jt,yt]),oi(()=>{let e=S.current;if(e==null)return;let t=null,n=()=>{t!=null&&(clearTimeout(t),t=null)},r=()=>{let t=Hr(e)?.dataset.itemPath??null;fe(e=>e===t?e:t)},i=()=>{n(),M.current=!0,r()},a=i=>{let a=i.relatedTarget;if(a==null){n(),t=setTimeout(()=>{if(t=null,Hr(e)!=null){r();return}M.current=!1,fe(null)},0);return}if(!(a instanceof Node)||!e.contains(a)){n(),M.current=!1,fe(null);return}let o=a instanceof HTMLElement?a.dataset.itemPath??null:null;fe(e=>e===o?e:o)};return e.addEventListener(`focusin`,i),e.addEventListener(`focusout`,a),()=>{n(),e.removeEventListener(`focusin`,i),e.removeEventListener(`focusout`,a)}},[]),oi(()=>{let e=S.current;e!=null&&(q.physical.scrollTop<=0?e.dataset.scrollAtTop=`true`:delete e.dataset.scrollAtTop)},[q.physical.scrollTop]),oi(()=>{let e=null,n=C.current,r=b.current,i=S.current;if(n==null)return;O.current=Ur(n,g);let a=()=>{let e=t.getVisibleCount(),r=Wr(O.current,g),i=Math.max(0,e*s-r);n.scrollTop>i&&(n.scrollTop=i),Re(Ni({controller:t,itemHeight:s,overscan:c,scrollTop:Math.min(n.scrollTop,i),stickyFolders:h,viewportHeight:r}))};if(!A.current){A.current=!0;let e=t.getFocusedIndex();if(e>=0){let r=Wr(O.current,g),i=t.getVisibleRows(e,e)[0]??null;Kr(n,e,s,r,h&&i!=null?Math.max(0,Math.min(i.ancestorPaths.length*s,Math.max(0,r-s))):0)}}D.current=a;let o=!1,l=t.subscribe(()=>{o?ue(e=>e+1):o=!0,a()}),u=()=>{Oe.current!==!0&&(r!=null&&(r.dataset.isScrolling??=``),i!=null&&(i.dataset.isScrolling??=``),y.current=!0,e!=null&&clearTimeout(e),e=setTimeout(()=>{r!=null&&delete r.dataset.isScrolling,i!=null&&delete i.dataset.isScrolling,y.current=!1,be(e=>e+1),e=null},50))},d=null,f=()=>{i!=null&&delete i.dataset.overlayReveal,d!=null&&(clearTimeout(d),d=null)},p=()=>{i!=null&&Oe.current!==!0&&(n.scrollTop>0||(i.dataset.overlayReveal=`true`,d!=null&&clearTimeout(d),d=setTimeout(()=>{f()},200)))},m=()=>{if(a(),n.scrollTop>0&&f(),Se.current!=null&&y.current&&Et.current(),Oe.current===!0){y.current=!1;return}me(e=>e==null?e:null),u()},_=()=>{u(),p()},v=new Set([`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,`PageUp`,`PageDown`,`Home`,`End`,` `,`Spacebar`]),x=e=>{v.has(e.key)&&_()};n.addEventListener(`scroll`,m,{passive:!0}),n.addEventListener(`wheel`,_,{passive:!0}),n.addEventListener(`touchmove`,_,{passive:!0}),n.addEventListener(`keydown`,x);let w=typeof ResizeObserver<`u`?new ResizeObserver(e=>{O.current=(e[0]==null?null:Gr(e[0]))??Ur(n,g),a()}):null;return w?.observe(n),()=>{D.current=()=>{},l(),n.removeEventListener(`scroll`,m),n.removeEventListener(`wheel`,_),n.removeEventListener(`touchmove`,_),n.removeEventListener(`keydown`,x),e!=null&&clearTimeout(e),d!=null&&clearTimeout(d),r!=null&&delete r.dataset.isScrolling,i!=null&&(delete i.dataset.isScrolling,delete i.dataset.overlayReveal),y.current=!1,O.current=null,w?.disconnect()}},[t,g,s,c,h]),oi(()=>{H||B==null||Dt(!1)},[Dt,H,B]);let Jt=si(()=>B==null?null:`${B.path}::${B.source}`,[B]);oi(()=>{if(Jt==null){m?.clearSlotContent(He);return}let t=Se.current;if(t==null)return;let n=v.current??_.current;if(n==null)return;let r={anchorElement:n,anchorRect:t.anchorRect??Yi(n.getBoundingClientRect()),close:e=>{Et.current(e?.restoreFocus??!0)},restoreFocus:()=>{Tt.current&&wt.current(Se.current?.path??null)}},i=e?.contextMenu?.render?.(t.item,r)??null;return m?.setSlotContent(He,i),e?.contextMenu?.onOpen?.(t.item,r),ca(i),queueMicrotask(()=>{i!=null&&i.isConnected&&document.activeElement===i&&ca(i)}),()=>{m?.clearSlotContent(He)}},[Jt,e?.contextMenu,m]),oi(()=>{B!=null&&t.getItem(B.path)==null&&Dt()},[Dt,B,t]),oi(()=>{if(B==null)return;let e=S.current?.getRootNode(),t=e instanceof ShadowRoot?e.host:S.current,n=e=>{let n=e.target;n instanceof Node&&(Ji(e)||_.current?.contains(n)!==!0&&t?.contains(n)!==!0&&Dt())},r=e=>{e.key===`Escape`&&(e.preventDefault(),e.stopPropagation(),Dt())};return document.addEventListener(`mousedown`,n,!0),document.addEventListener(`keydown`,r,!0),()=>{document.removeEventListener(`mousedown`,n,!0),document.removeEventListener(`keydown`,r,!0)}},[Dt,B]),oi(()=>{let e=C.current,n=S.current;if(e==null||n==null){N.current=G;return}let r=G==null?null:T.current.get(G)??null,i=Hr(n),a=i?.dataset.itemPath??null,o=et&&x.current===i,c=f&&w.current===i,l=F.current&&!nt,u=ee.current??0,d=Ce.current,p=we.current,m=Te.current,g=Ee.current,_=i!=null,v=M.current||_,y=N.current!==G,b=p!=null&&p===G&&G!=null,E=!1,O=!1;if(it!=null&&it.id!==k.current){k.current=it.id;let n=it.visibleIndex,r=t.getVisibleRows(n,n)[0]??null;if(r!=null){let t=h?Math.max(0,Math.min(r.ancestorPaths.length*s,Math.max(0,J-s))):vt;E=!0,O=qr(e,n,s,J,_t,it.offset,t)}t.clearScrollRequest(it.id)}let A=!E&&l&&Jr(e,K,s,J,_t,u),j=!E&&d!=null&&d===G&&Jr(e,K,s,J,_t,vt),P=!E&&m!=null&&m.path===G&&Jr(e,K,s,J,_t,m.viewportOffset),te=!E&&g!=null&&g.path===G&&e.scrollTop!==g.scrollTop;if(te&&(e.scrollTop=g.scrollTop),(te||O||j||P||A||v&&y&&d!==G&&!b&&Kr(e,K,s,J,vt))&&D.current(),E){N.current=G;return}if(!v){N.current=G;return}if(o){N.current=G;return}if(c&&!l){N.current=G;return}if(r==null){l&&K>=0&&(Jr(e,K,s,J,_t,u),D.current()),N.current=G;return}(y||l||d===G||p===G||m?.path===G||g?.path===G||a==null||a!==G)&&(Vr(r),d===G&&(Ce.current=null),p===G&&(we.current=null),m?.path===G&&(Te.current=null),g?.path===G&&(Ee.current=null),F.current=!1,ee.current=null),N.current=G},[t,K,G,bt,s,et,nt,mt,J,f,it,h,vt,_t,pt]);let Yt=K>=0&&K>=q.visible.startIndex&&K<=q.visible.endIndex,Xt=G!=null&&ht.some(e=>Ai(e.row)===G),Zt=Yt||Xt,Qt=Ge&&M.current===!0&&Zt?G:null,$t=_e===`pointer`?pe:null,en=B?.path??De.current??$t??Qt??pe,nn=B?.source===`right-click`;oi(()=>{y.current&&B==null||Ot(W(en))},[B,W,mt,J,ye,ht,en,Ot,pt]);let rn=ci(e=>{if(y.current||Ji(e))return;let t=e.target;if(!(t instanceof HTMLElement)||t.closest?.(`[data-type="context-menu-trigger"]`)!=null)return;let n=t.closest?.(`[data-file-tree-sticky-row="true"]`),r=t.closest?.(`[data-type="item"]`),i=n instanceof HTMLElement?n.dataset.fileTreeStickyPath??null:r instanceof HTMLElement?r.dataset.itemPath??null:null;i!=null&&ve(e=>e===`pointer`?e:`pointer`),me(e=>e===i?e:i)},[]),an=ci(()=>{me(null)},[]);oi(()=>{if(!at)return;let e=()=>{zt(),t.cancelDrag()};return window.addEventListener(`dragend`,e),()=>{window.removeEventListener(`dragend`,e),zt(),t.cancelDrag()}},[t,at]);let on=e=>{if(!at||t.getDragSession()==null||se.current)return;let n=Ii(e.target instanceof HTMLElement?e.target:null);t.setDragTarget(n),Vt(t.getDragSession()?.target??null),Ut(e.clientX,e.clientY),e.dataTransfer!=null&&(e.dataTransfer.dropEffect=`move`),e.preventDefault()},sn=e=>{if(!at||t.getDragSession()==null||se.current)return;let n=e.relatedTarget;n instanceof Node&&S.current?.contains(n)===!0||(Ft(),Lt(),t.setDragTarget(null))},cn=e=>{at&&t.getDragSession()!=null&&!se.current&&(e.preventDefault(),Bt(e.clientX,e.clientY),t.completeDrag(),It(),Ft(),Lt(),oe.current=null)},ln=q.window.height,un=q.window.offsetTop,dn=Math.min(0,J-ln),fn=Math.min(0,J-ln-vt),pn=de===G||F.current,mn=G!=null&&pn&&!bt&&K>=0?pt[K]??t.getVisibleRows(K,K)[0]??null:null,hn=mn==null?null:Yr(K,s,mt,ln),gn=oe.current,_n=lt!=null&&gn!=null&&gn.path===lt&&gn.index>=mt.start&&gn.index<=mt.end,vn=lt!=null&&gn!=null&&gn.path===lt&&!_n&&gn.path!==mn?.path?gn:null,yn=vn==null?null:Yr(vn.index,s,mt,ln),bn=Gi((K>=0?pt[K]??t.getVisibleRows(K,K)[0]??null:null)?.ancestorPaths.at(-1)??null),xn=nt&&G!=null?aa(o,G,!bt):void 0,Sn=B?.path??(nt?G:de),Cn=B?.path??pe,wn=W(en),Tn=H&&Ge&&!nn&&!et&&wn!=null&&he!=null&&en!=null,En=H&&(Tn||B!=null),Dn=B?.anchorRect,On=Dn==null&&wn!=null&&he!=null&&(B!=null||Tn)?he:null,kn=Dn==null?On==null?void 0:{top:`${On}px`}:{left:`${Dn.left}px`,position:`fixed`,right:`auto`,top:`${Dn.top}px`},An=nn?{opacity:`0`}:void 0,jn=ci((e,n,r,i)=>{let a=ti({event:{ctrlKey:e.ctrlKey,metaKey:e.metaKey,shiftKey:e.shiftKey},isDirectory:n.kind===`directory`,isSearchOpen:nt,mode:i}),o=a.toggleDirectory&&n.kind===`directory`,s=o?t.resolveMountedDirectoryPathFromInput(r):null;if(o&&s==null)return;let c=s??r;switch(a.selection.kind){case`range`:t.selectPathRange(c,a.selection.additive);break;case`toggle`:t.togglePathSelectionFromInput(c);break;case`single`:t.selectOnlyMountedPathFromInput(c)}let l=e.currentTarget instanceof HTMLElement?e.currentTarget:null,u=n.index>=q.visible.startIndex&&n.index<=q.visible.endIndex,d=i===`flow`&&u&&l!=null&&l.dataset.itemParked!==`true`;t.focusMountedPathFromInput(c),d&&(M.current=!0,fe(e=>e===c?e:c),ve(`focus`)),o&&t.toggleMountedDirectoryFromInput(c),a.closeSearch&&t.closeSearch(),a.revealCanonical&&jt(c,{targetOffset:`sticky-parents`})},[t,nt,q.visible.endIndex,q.visible.startIndex,jt]),Mn=()=>{if(y.current||!Ge||en==null||wn==null)return;let e=t.getItem(en);e!=null&&(Ot(wn),Tt.current=!0,xe({anchorRect:null,item:{kind:e.isDirectory()?`directory`:`file`,name:wn.getAttribute(`aria-label`)??en,path:e.getPath()},path:e.getPath(),source:`button`}))},Nn={contextHoverPath:Cn,contextMenuButtonTriggerEnabled:Ge,contextMenuButtonVisibility:Ke,contextMenuEnabled:H,contextMenuRightClickEnabled:qe,contextMenuTriggerMode:We,controller:t,directoriesWithGitChanges:i,dragAndDropEnabled:at,draggedPathSet:st,dragTarget:ct,gitLaneActive:Xe,gitStatusByPath:n,handleRowDragEnd:Gt,handleRowDragStart:Wt,handleRowTouchStart:Kt,ignoredGitDirectories:r,ignoredInheritanceCache:z,instanceId:o,itemHeight:s,onKeyDown:qt,onRowClick:jn,openContextMenuForRow:kt,registerButton:Je,registerRenameInput:U,renameView:Qe,renderDecorationForRow:xt,resolveIcon:Ze,shouldSuppressContextMenu:Mt,visualFocusPath:Sn},Pn={...Nn,registerButton:Ye};return X(`div`,{ref:S,id:ut,"data-file-tree-context-menu-button-visibility":H&&Ge?Ke:void 0,"data-file-tree-context-menu-trigger-mode":H?We:void 0,"data-file-tree-has-context-menu-action-lane":H&&Ge?`true`:void 0,"data-file-tree-has-git-lane":Xe?`true`:void 0,"data-file-tree-virtualized-root":`true`,onDragLeave:at?sn:void 0,onDragOver:at?on:void 0,onDrop:at?cn:void 0,onKeyDown:qt,onPointerLeave:H?an:void 0,onPointerOver:H?rn:void 0,role:`tree`,tabIndex:-1,style:{outline:`none`,position:`relative`},children:[X(`style`,{"data-file-tree-guide-style":`true`,dangerouslySetInnerHTML:{__html:bn}}),X(`slot`,{name:Ve,"data-type":`header-slot`}),f?X(`div`,{"data-file-tree-search-container":!0,"data-open":nt?`true`:`false`,children:X(`input`,{ref:w,"aria-activedescendant":xn,"aria-controls":ut,placeholder:`Search…`,"data-file-tree-search-input":!0,"data-file-tree-search-input-fake-focus":Ne?`true`:void 0,value:rt,onBlur:()=>{(d!==`retain`||Fe.current)&&t.closeSearch()},onFocus:Ie,onPointerDown:Ie,onInput:e=>{Ie();let n=e.currentTarget;t.setSearch(n.value)}})}):null,X(`div`,{ref:C,"data-file-tree-virtualized-scroll":`true`,children:[h&&ze&&ht.length>0?X(`div`,{"aria-hidden":`true`,"data-file-tree-sticky-overlay":`true`,children:X(`div`,{"data-file-tree-sticky-overlay-content":`true`,style:{height:`${dt}px`},children:ht.map((e,t)=>ua(Pn,e.row,`sticky:${Ai(e.row)}`,{mode:`sticky`,style:{left:`0`,position:`absolute`,right:`0`,top:`${e.top}px`,zIndex:`${ht.length-t}`}}))})}):null,X(`div`,{ref:b,"data-file-tree-virtualized-list":`true`,style:{height:`${_t}px`},children:[X(`div`,{"data-file-tree-virtualized-sticky-offset":`true`,"aria-hidden":`true`,style:{height:`${un}px`}}),X(`div`,{"data-file-tree-virtualized-sticky":`true`,style:{height:`${ln}px`,top:`${dn}px`,bottom:`${fn}px`},children:[da(Nn,mt,yt),mn!=null&&hn!=null?ua(Nn,mn,`parked:${mn.path}`,{isParked:!0,style:{left:`0`,opacity:`0`,pointerEvents:lt===mn.path?`none`:void 0,position:`absolute`,right:`0`,top:`${hn}px`}}):null,vn!=null&&yn!=null?ua(Nn,vn,`parked-drag:${vn.path}`,{isParked:!0,style:{left:`0`,opacity:`0`,pointerEvents:`none`,position:`absolute`,right:`0`,top:`${yn}px`}}):null]})]})]}),H?X(`div`,{ref:_,"data-type":`context-menu-anchor`,"data-visible":En?`true`:`false`,style:kn,children:[X(`button`,{ref:v,type:`button`,"data-type":Ue,"aria-label":`Options`,"aria-haspopup":`menu`,"aria-expanded":B==null?`false`:`true`,"data-visible":Tn?`true`:`false`,onMouseDown:e=>{e.preventDefault()},onClick:e=>{if(e.preventDefault(),e.stopPropagation(),B!=null){Dt();return}Mn()},tabIndex:-1,style:An,children:X(rr,{...Ze(`file-tree-icon-ellipsis`)})}),B==null?null:X(`slot`,{name:He})]}):null,B==null?null:X(`div`,{"data-type":`context-menu-wash`,"aria-hidden":`true`,onMouseDownCapture:e=>{e.preventDefault(),Dt()},onTouchStartCapture:e=>{e.preventDefault(),e.stopPropagation(),Dt()},onTouchMoveCapture:e=>{e.preventDefault(),e.stopPropagation()},onWheelCapture:e=>{e.preventDefault(),e.stopPropagation()}})]})}var pa,ma,ha,ga;function _a(){return(_a=e((()=>{We(),Pe(),nt(),on(),sr(),br(),Nr(),Lr(),Xr(),$r(),er(),Oi(),nr(),pa=400,ma=40,ha=18,ga=new Set([`ArrowDown`,`ArrowLeft`,`ArrowRight`,`ArrowUp`,`End`,`Home`,`PageDown`,`PageUp`])})))()}function va(e,t){xa.renderRoot(e,t)}function ya(e,t){xa.hydrateRoot(e,t)}function ba(e){xa.unmountRoot(e)}var xa;function Sa(){return(Sa=e((()=>{_a(),er(),xa={hydrateRoot:(e,t)=>{zn(hn(fa,t),e)},renderRoot:(e,t)=>{Rn(hn(fa,t),e)},unmountRoot:e=>{Rn(null,e)}}})))()}var Ca;function wa(){return(wa=e((()=>{Ca=class{#e=new Map;#t=null;clearAll(){for(let e of this.#e.values())e.remove();this.#e.clear()}clearSlotContent(e){let t=this.#n(e);t!=null&&(t.remove(),this.#e.delete(e))}setHost(e){if(this.#t=e,e!=null){this.#i(e);for(let[e,t]of this.#e)this.#r(e,t)}}setSlotContent(e,t){let n=this.#n(e);if(n===t){t!=null&&(this.#e.set(e,t),this.#r(e,t));return}if(n?.remove(),t==null){this.#e.delete(e);return}this.#e.set(e,t),this.#r(e,t)}setSlotHtml(e,t){let n=t?.trim()??``;if(n.length===0){this.setSlotContent(e,null);return}let r=this.#n(e);if(r!=null&&r.innerHTML===n){this.#e.set(e,r),this.#r(e,r);return}let i=document.createElement(`div`);i.innerHTML=n,this.setSlotContent(e,i)}#n(e){let t=this.#e.get(e)??null;if(t!=null)return t;let n=this.#t;if(n==null)return null;for(let t of Array.from(n.children))if(t instanceof HTMLElement&&t.dataset.fileTreeManagedSlot===e)return t;return null}#r(e,t){t.slot=e,t.dataset.fileTreeManagedSlot=e,this.#t!=null&&t.parentNode!==this.#t&&this.#t.appendChild(t)}#i(e){for(let t of Array.from(e.children)){if(!(t instanceof HTMLElement))continue;let e=t.dataset.fileTreeManagedSlot;e==null||this.#e.has(e)||this.#e.set(e,t)}}}})))()}function Ta(){return(Ta=e((()=>{er(),Array.isArray})))()}function Ea(e){return e!=null&&e.length>0?e:(ja+=1,`pst_ft_${ja}`)}function Da({initialVisibleRowCount:e,itemHeight:t}){return e==null?420:Math.max(0,e)*(t??tt)}function Oa(e){if(typeof document>`u`)return;let t=document.createElement(`div`);t.innerHTML=e;let n=t.querySelector(`svg`);return n instanceof SVGElement?n:void 0}function ka(e){return e.querySelector(`#file-tree-icon-chevron`)instanceof SVGElement&&e.querySelector(`#file-tree-icon-file`)instanceof SVGElement&&e.querySelector(`#file-tree-icon-dot`)instanceof SVGElement&&e.querySelector(`#file-tree-icon-lock`)instanceof SVGElement}function Aa(e){return Array.from(e.children).filter(e=>e instanceof SVGElement)}var ja,Ma;function Na(){return(Na=e((()=>{Fe(),We(),et(),nt(),ot(),J(),on(),pn(),Sa(),wa(),er(),Ta(),ja=0,Ma=class{static LoadedCustomComponent=!0;#e;#t;#n;#r;#i;#a;#o;#s;#c;#l=new Ca;#u;#d;#f;#p;#m;#h;#g;#_;#v;#y=null;#b;#x=!1;#S=!1;constructor(e){let{composition:t,density:n,fileTreeSearchMode:r,gitStatus:i,id:a,initialSearchQuery:o,icons:s,itemHeight:c,onSearchChange:l,onSelectionChange:u,overscan:d,renderRowDecoration:f,renaming:p,search:m,searchBlurBehavior:h,searchFakeFocus:g,stickyFolders:_,unsafeCSS:v,initialVisibleRowCount:y,...b}=e;this.#e=t,this.#n=Ea(a),this.#p=fn(i),this.#m=s,this.#h=v,this.#r=u,this.#i=f,this.#a=p!=null&&p!==!1,this.#o=h,this.#s=m===!0,this.#c=g===!0,this.#u=Qe(n,c),this.#d={itemHeight:this.#u.itemHeight,overscan:d,stickyFolders:_,initialVisibleRowCount:y},this.#t=new an({...b,fileTreeSearchMode:r,initialSearchQuery:o,onSearchChange:l,renaming:p}),this.#v=this.#t.getSelectionVersion(),this.#y=this.#r==null?null:this.subscribe(()=>{this.#D()})}unmount(){this.#b!=null&&(ba(this.#b),delete this.#b.dataset.fileTreeVirtualizedWrapper,this.#b=void 0),this.#l.clearAll(),this.#l.setHost(null),this.#f!=null&&(delete this.#f.dataset.fileTreeVirtualized,this.#I(this.#f),this.#f=void 0)}cleanUp(){this.unmount(),this.#y?.(),this.#y=null,this.#t.destroy()}getFileTreeContainer(){return this.#f}getItem(e){return this.#t.getItem(e)}getFocusedItem(){return this.#t.getFocusedItem()}getFocusedPath(){return this.#t.getFocusedPath()}getSelectedPaths(){return this.#t.getSelectedPaths()}getComposition(){return this.#e}getItemHeight(){return this.#u.itemHeight}getDensityFactor(){return this.#u.factor}subscribe(e){let t=!1;return this.#t.subscribe(()=>{if(!t){t=!0;return}e()})}focusPath(e){this.#t.focusPath(e)}scrollToPath(e,t){this.#t.scrollToPath(e,t)}focusNearestPath(e){return this.#t.focusNearestPath(e)}add(e){this.#t.add(e)}batch(e){this.#t.batch(e)}move(e,t,n){this.#t.move(e,t,n)}onMutation(e,t){return this.#t.onMutation(e,t)}setSearch(e){this.#t.setSearch(e)}openSearch(e){this.#t.openSearch(e)}closeSearch(){this.#t.closeSearch()}isSearchOpen(){return this.#t.isSearchOpen()}getSearchValue(){return this.#t.getSearchValue()}getSearchMatchingPaths(){return this.#t.getSearchMatchingPaths()}focusNextSearchMatch(){this.#t.focusNextSearchMatch()}focusPreviousSearchMatch(){this.#t.focusPreviousSearchMatch()}startRenaming(e,t){return this.#t.startRenaming(e,t)}remove(e,t){this.#t.remove(e,t)}resetPaths(e,t){this.#t.resetPaths(e,t)}setComposition(e){this.#e=e;let t=this.#T();t!=null&&(this.#O(),va(t.wrapper,this.#w()))}setGitStatus(e){this.#p=fn(e,this.#p);let t=this.#T();t!=null&&va(t.wrapper,this.#w())}setIcons(e){this.#m=e;let t=this.#T();t!=null&&(this.#E(t.host,t.wrapper),va(t.wrapper,this.#w()))}hydrate({fileTreeContainer:e}){let t=this.#P(e),n=this.#N(t);this.#O(),ya(n,this.#w())}render({containerWrapper:e,fileTreeContainer:t}){let n=this.#P(t??this.#f,e),r=this.#N(n);this.#O(),va(r,this.#w())}#C(){return{initialViewportHeight:Da({initialVisibleRowCount:this.#d.initialVisibleRowCount,itemHeight:this.#d.itemHeight}),itemHeight:this.#d.itemHeight,overscan:this.#d.overscan,stickyFolders:this.#d.stickyFolders}}#w(){return{composition:this.#e,controller:this.#t,gitStatusByPath:this.#p?.statusByPath,ignoredGitDirectories:this.#p?.ignoredDirectoryPaths,directoriesWithGitChanges:this.#p?.directoriesWithChanges,icons:this.#m,instanceId:this.#n,renamingEnabled:this.#a,renderRowDecoration:this.#i,searchBlurBehavior:this.#o,searchEnabled:this.#s,searchFakeFocus:this.#c,slotHost:this.#l,...this.#C()}}#T(){let e=this.#f,t=this.#b;return e==null||t==null?null:{host:e,wrapper:t}}#E(e,t){let n=e.shadowRoot;n!=null&&(this.#k(n),this.#A(n)),this.#j(t)}#D(){let e=this.#r;if(e==null)return;let t=this.#t.getSelectionVersion();t!==this.#v&&(this.#v=t,e(this.#t.getSelectedPaths()))}#O(){let e=this.#e?.header?.render;if(e!=null){this.#l.setSlotContent(Ve,e());return}this.#l.setSlotHtml(Ve,this.#e?.header?.html??null)}#k(e){let t=Aa(e).find(e=>ka(e)),n=Oa(Ne(Me(this.#m).set));n!=null&&(t==null||t.outerHTML!==n.outerHTML)&&(t==null?e.prepend(n):t.replaceWith(n))}#A(e){let t=Aa(e),n=t.find(e=>ka(e)),r=t.filter(e=>e!==n),i=Me(this.#m).spriteSheet?.trim()??``;if(i.length===0){for(let e of r)e.remove();return}let a=Oa(i);if(a==null){for(let e of r)e.remove();return}if(r.length!==1||r[0].outerHTML!==a.outerHTML){for(let e of r)e.remove();e.appendChild(a)}}#j(e){let t=Me(this.#m);t.colored&&V(t.set)?e.dataset.fileTreeColoredIcons=`true`:delete e.dataset.fileTreeColoredIcons}#M(e){let t=e.querySelector(`style[${Re}]`);if(this.#g==null&&t instanceof HTMLStyleElement&&(this.#g=t),this.#h==null||this.#h===``){this.#g?.remove(),this.#g=void 0,this.#_=void 0;return}(this.#g?.parentNode!==e||this.#_!==this.#h)&&(this.#g??=document.createElement(`style`),this.#g.setAttribute(Re,``),this.#g.parentNode!==e&&e.appendChild(this.#g),this.#g.textContent=it(this.#h),this.#_=this.#h)}#N(e){if(this.#b!=null)return this.#b;let t=e.shadowRoot;if(t==null)throw Error(`FileTree requires a shadow root`);let n=Array.from(t.children).filter(e=>e instanceof HTMLDivElement&&typeof e.dataset.fileTreeId==`string`&&e.dataset.fileTreeId.length>0),r=n.find(e=>e.dataset.fileTreeId===this.#n)??n[0];return r!=null&&(this.#n=r.dataset.fileTreeId??this.#n),this.#b=r??document.createElement(`div`),this.#b.dataset.fileTreeId=this.#n,this.#b.dataset.fileTreeVirtualizedWrapper=`true`,this.#E(e,this.#b),this.#b.parentNode!==t&&t.appendChild(this.#b),this.#b}#P(e,t){let n=e??this.#f??document.createElement(`file-tree-container`);t!=null&&n.parentNode!==t&&t.appendChild(n);let r=n.shadowRoot??n.attachShadow({mode:`open`});return ft(n,r),this.#M(r),n.dataset.fileTreeVirtualized=`true`,n.style.display=`flex`,this.#F(n),this.#l.setHost(n),this.#f=n,n}#F(e){e.style.getPropertyValue(`--trees-item-height`)===``&&(e.style.setProperty(`--trees-item-height`,`${String(this.#u.itemHeight)}px`),this.#x=!0),e.style.getPropertyValue(`--trees-density-override`)===``&&(e.style.setProperty(`--trees-density-override`,String(this.#u.factor)),this.#S=!0)}#I(e){this.#x&&=(e.style.removeProperty(`--trees-item-height`),!1),this.#S&&=(e.style.removeProperty(`--trees-density-override`),!1)}}})))()}function Pa(e){let[t]=(0,Fa.useState)(()=>new Ma(e)),n=(0,Fa.useRef)({timeout:null,model:t});return(0,Fa.useEffect)(()=>{let{current:e}=n;return e.timeout!=null&&(clearTimeout(e.timeout),e.timeout=null),()=>{e.timeout=setTimeout(()=>e.model.cleanUp(),1)}},[]),{model:t}}var Fa;function Ia(){return(Ia=e((()=>{Na(),Fa=E()})))()}function La({isLoadingOpenTargets:e=!1,onAddToChat:t,onCopyPath:n,onOpenInTarget:r,onSaveAs:i,primaryTarget:a,targetPath:o,visibleTargets:s}){if(o==null)return[];let c=n==null?`workspace`:`review`,l=[];return i!=null&&l.push({id:`save-as`,message:_({id:`markdown.fileReference.saveAs`,defaultMessage:`Save as…`,description:`Context menu action to save a file tree item to a user-selected location`}),onSelect:()=>{i(o)}}),n!=null&&l.push({id:`copy-path`,message:_({id:`codex.review.fileTree.contextMenu.copyPath`,defaultMessage:`Copy path`,description:`Context menu action to copy the path of a file tree item`}),onSelect:()=>{n(o)}}),t!=null&&l.push({id:`add-to-chat`,message:_({id:`threadSidePanel.workspaceBrowser.addToChat`,defaultMessage:`Add to chat`,description:`Context menu action for adding a file from the file tree to the current chat`}),onSelect:()=>{t(o)}}),e?[{id:`open-in-loading`,message:Ba(c),tooltipMessage:_({id:`threadSidePanel.workspaceBrowser.openIn.loading`,defaultMessage:`Loading available apps…`,description:`Tooltip shown when the file tree is still loading app options for opening a file`}),enabled:!1},{id:`open-in-separator`,type:`separator`},...l]:a==null?l:[...fe({idPrefix:Ra(c),messages:za(c),onOpenInTarget:(e,t)=>{r(e,t,o)},primaryTarget:a,visibleTargets:s}),{id:`open-in-separator`,type:`separator`},...l]}function Ra(e){switch(e){case`review`:return`review-file-tree-open`;case`workspace`:return`workspace-directory-tree-open`}}function za(e){switch(e){case`review`:return{openInTarget:_({id:`codex.review.fileTree.contextMenu.openInTarget`,defaultMessage:`Open in {target}`,description:`Context menu action to open a review file in the preferred app`}),openIn:Ba(e),openInTargetSubmenu:_({id:`codex.review.fileTree.contextMenu.openWithTarget`,defaultMessage:`{target}`,description:`Context menu action to open a review file in a specific app`})};case`workspace`:return{openInTarget:_({id:`threadSidePanel.workspaceBrowser.openInTarget`,defaultMessage:`Open in {target}`,description:`Context menu action to open a workspace browser file in the preferred app`}),openIn:Ba(e),openInTargetSubmenu:_({id:`threadSidePanel.workspaceBrowser.openInTargetSubmenu`,defaultMessage:`{target}`,description:`Context menu action to open a workspace browser file in a specific app`})}}}function Ba(e){switch(e){case`review`:return _({id:`codex.review.fileTree.contextMenu.openWith`,defaultMessage:`Open with`,description:`Context menu submenu label for choosing an app to open a review file`});case`workspace`:return _({id:`threadSidePanel.workspaceBrowser.openIn`,defaultMessage:`Open in…`,description:`Context menu submenu label for choosing an app to open a workspace browser file`})}}function Va({cwd:e,isWindowsHost:t,itemPath:n,targetPathByDisplayPath:r}){return n==null?null:r.get(n)??f(e??``,n,t)}function Ha(){return(Ha=e((()=>{l(),be(),m()})))()}function Ua(e){for(let t of e.composedPath()){if(!(t instanceof Element)||t.getAttribute(`data-item-type`)!==`file`)continue;let e=t.getAttribute(`data-item-path`);if(e)return e}return null}function Wa(){return(Wa=e((()=>{})))()}var Ga;function Ka(){return(Ka=e((()=>{Ga=`<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 6.41797C10.367 6.41815 10.6649 6.71599 10.665 7.08301V9.33496H12.916C13.2832 9.33496 13.5809 9.63287 13.5811 10C13.5809 10.3671 13.2832 10.665 12.916 10.665H10.665V12.916C10.665 13.2832 10.3671 13.5809 10 13.5811C9.63284 13.5809 9.33496 13.2832 9.33496 12.916V10.665H7.08301C6.71596 10.6649 6.41815 10.367 6.41797 10C6.41813 9.63295 6.71595 9.33509 7.08301 9.33496H9.33496V7.08301C9.33513 6.71596 9.63295 6.4181 10 6.41797Z" fill="currentColor" />
  <path d="M12.666 2.66797C13.3549 2.66797 13.9121 2.66735 14.3623 2.7041C14.8202 2.74151 15.2268 2.82084 15.6035 3.0127C16.1989 3.31608 16.6829 3.80115 16.9863 4.39649C17.1781 4.77304 17.2575 5.17902 17.2949 5.63672C17.3317 6.08689 17.3311 6.64406 17.3311 7.33301V12.666C17.3311 13.3549 17.3317 13.9121 17.2949 14.3623C17.2575 14.8203 17.1782 15.2268 16.9863 15.6035C16.6829 16.1988 16.1988 16.6829 15.6035 16.9863C15.2268 17.1783 14.8203 17.2575 14.3623 17.2949C13.9121 17.3317 13.3549 17.3311 12.666 17.3311H7.33301C6.64403 17.3311 6.08691 17.3317 5.63672 17.2949C5.17899 17.2575 4.77306 17.1781 4.39649 16.9863C3.80114 16.6829 3.31609 16.1989 3.0127 15.6035C2.82085 15.2269 2.74151 14.8202 2.7041 14.3623C2.66736 13.9122 2.66797 13.3548 2.66797 12.666V7.33301C2.66797 6.64406 2.66732 6.08689 2.7041 5.63672C2.74152 5.17904 2.82093 4.77302 3.0127 4.39649C3.31613 3.80104 3.80103 3.31611 4.39649 3.0127C4.77304 2.82092 5.17902 2.74152 5.63672 2.7041C6.08691 2.66732 6.64403 2.66797 7.33301 2.66797H12.666ZM7.33301 3.99805C6.6221 3.99805 6.12859 3.99894 5.74512 4.03027C5.36955 4.06098 5.15798 4.11775 5 4.19824C4.65484 4.37414 4.37416 4.65485 4.19824 5C4.11775 5.15797 4.06098 5.36959 4.03027 5.74512C3.99894 6.12858 3.99805 6.62214 3.99805 7.33301V12.666C3.99805 13.3767 3.99898 13.8705 4.03027 14.2539C4.06094 14.6292 4.11788 14.8411 4.19824 14.999C4.37412 15.3442 4.65487 15.6258 5 15.8018C5.15795 15.8822 5.36972 15.939 5.74512 15.9697C6.12859 16.0011 6.6221 16.001 7.33301 16.001H12.666C13.3767 16.001 13.8705 16.001 14.2539 15.9697C14.6292 15.9391 14.8411 15.8821 14.999 15.8018C15.3443 15.6258 15.6258 15.3443 15.8018 14.999C15.8821 14.8411 15.9391 14.6292 15.9697 14.2539C16.001 13.8705 16.001 13.3767 16.001 12.666V7.33301C16.001 6.62213 16.0011 6.12858 15.9697 5.74512C15.939 5.36976 15.8822 5.15795 15.8018 5C15.6258 4.65488 15.3442 4.37411 14.999 4.19824C14.8411 4.11787 14.6292 4.06094 14.2539 4.03027C13.8705 3.99898 13.3767 3.99805 12.666 3.99805H7.33301Z" fill="currentColor" />
</svg>
`})))()}var qa;function Ja(){return(Ja=e((()=>{qa=`<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12.916 9.33496C13.2833 9.33496 13.5811 9.63273 13.5811 10C13.5811 10.3673 13.2833 10.665 12.916 10.665H7.08301C6.71585 10.6649 6.41797 10.3672 6.41797 10C6.41797 9.63281 6.71585 9.33509 7.08301 9.33496H12.916Z" fill="currentColor" />
  <path d="M12.666 2.66797C13.3549 2.66797 13.9121 2.66735 14.3623 2.7041C14.8202 2.74151 15.2268 2.82084 15.6035 3.0127C16.1989 3.31608 16.6829 3.80115 16.9863 4.39649C17.1781 4.77304 17.2575 5.17902 17.2949 5.63672C17.3317 6.08689 17.3311 6.64406 17.3311 7.33301V12.666C17.3311 13.3549 17.3317 13.9121 17.2949 14.3623C17.2575 14.8203 17.1782 15.2268 16.9863 15.6035C16.6829 16.1988 16.1988 16.6829 15.6035 16.9863C15.2268 17.1783 14.8203 17.2575 14.3623 17.2949C13.9121 17.3317 13.3549 17.3311 12.666 17.3311H7.33301C6.64403 17.3311 6.08691 17.3317 5.63672 17.2949C5.17899 17.2575 4.77306 17.1781 4.39649 16.9863C3.80114 16.6829 3.31609 16.1989 3.0127 15.6035C2.82085 15.2269 2.74151 14.8202 2.7041 14.3623C2.66736 13.9122 2.66797 13.3548 2.66797 12.666V7.33301C2.66797 6.64406 2.66732 6.08689 2.7041 5.63672C2.74152 5.17904 2.82093 4.77302 3.0127 4.39649C3.31613 3.80104 3.80103 3.31611 4.39649 3.0127C4.77304 2.82092 5.17902 2.74152 5.63672 2.7041C6.08691 2.66732 6.64403 2.66797 7.33301 2.66797H12.666ZM7.33301 3.99805C6.6221 3.99805 6.12859 3.99894 5.74512 4.03027C5.36955 4.06098 5.15798 4.11775 5 4.19824C4.65484 4.37414 4.37416 4.65485 4.19824 5C4.11775 5.15797 4.06098 5.36959 4.03027 5.74512C3.99894 6.12858 3.99805 6.62214 3.99805 7.33301V12.666C3.99805 13.3767 3.99898 13.8705 4.03027 14.2539C4.06094 14.6292 4.11788 14.8411 4.19824 14.999C4.37412 15.3442 4.65487 15.6258 5 15.8018C5.15795 15.8822 5.36972 15.939 5.74512 15.9697C6.12859 16.0011 6.6221 16.001 7.33301 16.001H12.666C13.3767 16.001 13.8705 16.001 14.2539 15.9697C14.6292 15.9391 14.8411 15.8821 14.999 15.8018C15.3443 15.6258 15.6258 15.3443 15.8018 14.999C15.8821 14.8411 15.9391 14.6292 15.9697 14.2539C16.001 13.8705 16.001 13.3767 16.001 12.666V7.33301C16.001 6.62213 16.0011 6.12858 15.9697 5.74512C15.939 5.36976 15.8822 5.15795 15.8018 5C15.6258 4.65488 15.3442 4.37411 14.999 4.19824C14.8411 4.11787 14.6292 4.06094 14.2539 4.03027C13.8705 3.99898 13.3767 3.99805 12.666 3.99805H7.33301Z" fill="currentColor" />
</svg>
`})))()}var Ya;function Xa(){return(Xa=e((()=>{Ya=`<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 8.33301C10.9205 8.33301 11.667 9.07953 11.667 10C11.667 10.9205 10.9205 11.667 10 11.667C9.07961 11.6669 8.334 10.9204 8.33399 10C8.33399 9.07958 9.0796 8.3331 10 8.33301Z" fill="currentColor" />
  <path d="M12.667 2.66797C13.3558 2.66797 13.9132 2.66734 14.3633 2.7041C14.8211 2.74154 15.2279 2.82079 15.6045 3.0127C16.1998 3.31614 16.6839 3.8011 16.9873 4.39649C17.1791 4.77306 17.2585 5.17899 17.2959 5.63672C17.3327 6.08689 17.332 6.64406 17.332 7.33301V12.666C17.332 13.3548 17.3326 13.9122 17.2959 14.3623C17.2585 14.8201 17.1791 15.2269 16.9873 15.6035C16.684 16.1987 16.1996 16.6829 15.6045 16.9863C15.2279 17.1782 14.8211 17.2575 14.3633 17.2949C13.9132 17.3317 13.3558 17.3311 12.667 17.3311H7.33399C6.64513 17.3311 6.08786 17.3317 5.6377 17.2949C5.17997 17.2575 4.77403 17.1781 4.39746 16.9863C3.80197 16.6829 3.31712 16.199 3.01367 15.6035C2.82172 15.2268 2.7425 14.8203 2.70508 14.3623C2.66833 13.9121 2.66895 13.3549 2.66895 12.666V7.33301C2.66895 6.64406 2.6683 6.08689 2.70508 5.63672C2.7425 5.17907 2.82191 4.77301 3.01367 4.39649C3.31713 3.80115 3.80208 3.31606 4.39746 3.0127C4.77393 2.82108 5.18011 2.7415 5.6377 2.7041C6.08785 2.66736 6.64515 2.66797 7.33399 2.66797H12.667ZM7.33399 3.99805C6.62326 3.99805 6.12954 3.99898 5.74609 4.03027C5.37079 4.06094 5.15893 4.11787 5.00098 4.19824C4.65588 4.37409 4.37516 4.65496 4.19922 5C4.11874 5.15796 4.06196 5.36963 4.03125 5.74512C3.99992 6.12858 3.99902 6.62213 3.99902 7.33301V12.666C3.99902 13.3767 3.99996 13.8705 4.03125 14.2539C4.06193 14.6295 4.11878 14.841 4.19922 14.999C4.37515 15.3443 4.6557 15.6258 5.00098 15.8018C5.15894 15.8821 5.37074 15.9391 5.74609 15.9697C6.12955 16.001 6.62323 16.001 7.33399 16.001H12.667C13.3776 16.001 13.8715 16.001 14.2549 15.9697C14.6299 15.939 14.8421 15.8821 15 15.8018C15.345 15.6258 15.6269 15.3441 15.8027 14.999C15.883 14.8411 15.9401 14.6289 15.9707 14.2539C16.002 13.8705 16.002 13.3767 16.002 12.666V7.33301C16.002 6.62213 16.002 6.12858 15.9707 5.74512C15.94 5.36972 15.8832 5.15795 15.8027 5C15.6269 4.65483 15.3451 4.37417 15 4.19824C14.8421 4.11782 14.6302 4.06097 14.2549 4.03027C13.8715 3.99897 13.3776 3.99805 12.667 3.99805H7.33399Z" fill="currentColor" />
</svg>
`})))()}function Za(e){let t=(0,mo.c)(118),{cwd:n,contextMenuEnabled:r,decorationIcons:i,flattenEmptyDirectories:o,gitStatus:s,hostId:c,icons:l,initialExpandedPaths:d,initialScrollTop:p,itemHeight:m,onClick:h,onDoubleClick:g,onExpandedPathsChange:_,onSelectionChange:v,onStateChange:y,paths:b,revealSelectedPath:S,revealSelectedPathScrollOffset:C,renderRowDecoration:T,resetKey:E,selectedPath:D,surface:O,unsafeCSS:k}=e,A=r===void 0||r,j=o!==void 0&&o,M=p===void 0?0:p,N=m===void 0?_o:m,P=S!==void 0&&S,F=C===void 0?`nearest`:C,ee=O===void 0?`main`:O,ne=u(te),re=ce(),oe=ie(re),{platform:I}=ae(),se=me(`add-context-file`),L;t[0]!==n||t[1]!==c?(L={cwd:n,hostId:c},t[0]=n,t[1]=c,t[2]=L):L=t[2];let le=ke(L),R;t[3]===b?R=t[4]:(R=b.map($a),t[3]=b,t[4]=R);let z=R,ue;if(t[5]!==n||t[6]!==b||t[7]!==I){ue=new Map;for(let e of b)typeof e!=`string`&&ue.set(e.displayPath,f(n??``,e.path,I===`windows`));t[5]=n,t[6]=b,t[7]=I,t[8]=ue}else ue=t[8];let de=ue,fe;t[9]!==i||t[10]!==l?(fe=no(l,i),t[9]=i,t[10]=l,t[11]=fe):fe=t[11];let pe=fe,he=ee===`dropdown`?`var(--color-surface-elevated-secondary)`:`var(--color-surface)`,ge=(0,ho.useRef)(null),_e;t[12]===d?_e=t[13]:(_e=Array.from(d??[]),t[12]=d,t[13]=_e);let ve=(0,ho.useRef)(_e),ye=(0,ho.useRef)(null),be=(0,ho.useRef)(M),xe=(0,ho.useRef)(D??null),Se;t[14]===y?Se=t[15]:(Se=()=>{y?.({expandedPaths:ve.current,scrollTop:be.current,selectedPath:xe.current})},t[14]=y,t[15]=Se);let Ce=w(Se),we;t[16]!==_||t[17]!==Ce?(we=e=>{ve.current=e,_?.(e),Ce()},t[16]=_,t[17]=Ce,t[18]=we):we=t[18];let Te=w(we),Ee;t[19]!==v||t[20]!==Ce?(Ee=e=>{xe.current=e[0]??null,v?.(e),Ce()},t[19]=v,t[20]=Ce,t[21]=Ee):Ee=t[21];let De=w(Ee),Oe;t[22]===D?Oe=t[23]:(Oe=D==null?void 0:[D],t[22]=D,t[23]=Oe);let je=`
      :host {
        --trees-bg-override: ${he};
        --trees-bg-muted-override: var(--color-background-primary-ghost-hover);
        --trees-border-color-override: var(--color-border);
        --trees-fg-override: var(--color-text);
        --trees-font-size-override: 13px;
        --trees-focus-ring-color-override: var(--color-ring);
        --trees-git-added-color-override: var(--color-codex-git-added);
        --trees-git-deleted-color-override: var(--color-codex-git-deleted);
        --trees-git-ignored-color-override: var(--color-codex-git-ignored);
        --trees-git-lane-width-override: 20px;
        --trees-git-modified-color-override: var(--color-codex-git-modified);
        --trees-git-renamed-color-override: var(--color-codex-git-modified);
        --trees-git-untracked-color-override: var(--color-codex-git-added);
        --trees-item-padding-x-override: 6px;
        --trees-item-margin-x-override: 0px;
        --trees-level-gap-override: 0px;
        --trees-padding-inline-override: 0px;
        --trees-scrollbar-gutter-override: 0px;
        --trees-scrollbar-gutter-measured: 0px;
        --trees-selected-bg-override: var(--color-background-primary-soft-active);
        --trees-selected-fg-override: var(--color-text-emphasis);
        --trees-item-row-gap-override: 10px;
      }

      [data-file-tree-sticky-overlay-content='true'],
      [data-file-tree-sticky-row='true'] {
        background-color: ${he};
      }

      [data-file-tree-virtualized-scroll='true'] {
        scrollbar-gutter: auto;
      }

      [role="treeitem"] {
        cursor: var(--cursor-interaction) !important;
      }

      [role="treeitem"] * {
        cursor: var(--cursor-interaction) !important;
      }

      [data-item-type='file'][data-item-path$='/']:has([data-item-section='content']:empty) {
        display: none;
      }

      [data-item-git-status] > [data-item-section='content'] {
        color: inherit;
      }

      [data-item-git-status='added'] > [data-item-section='git'] > span,
      [data-item-git-status='deleted'] > [data-item-section='git'] > span,
      [data-item-git-status='modified'] > [data-item-section='git'] > span {
        font-size: 0;
      }

      [data-item-git-status='added'] > [data-item-section='git'] > span::before,
      [data-item-git-status='deleted'] > [data-item-section='git'] > span::before,
      [data-item-git-status='modified'] > [data-item-section='git'] > span::before {
        width: 20px;
        height: 20px;
        background-color: currentColor;
        content: '';
        mask: var(--base-file-tree-git-status-icon) center / contain no-repeat;
      }

      [data-item-git-status='added'] > [data-item-section='git'] > span::before {
        --base-file-tree-git-status-icon: url("${yo}");
      }

      [data-item-git-status='deleted'] > [data-item-section='git'] > span::before {
        --base-file-tree-git-status-icon: url("${bo}");
      }

      [data-item-git-status='modified'] > [data-item-section='git'] > span::before {
        --base-file-tree-git-status-icon: url("${xo}");
      }

      /* Filter out @pierre/truncate's subpixel one-line overflow false positives. */
      @container measure (height <= calc(1lh + 1px)) {
        [data-truncate-marker] {
          opacity: 0;
        }
      }

      ${k??``}
    `,Me;t[24]!==pe||t[25]!==j||t[26]!==s||t[27]!==De||t[28]!==d||t[29]!==N||t[30]!==T||t[31]!==Oe||t[32]!==je||t[33]!==z?(Me={fileTreeSearchMode:`hide-non-matches`,flattenEmptyDirectories:j,gitStatus:s,icons:pe,initialExpandedPaths:d,initialSelectedPaths:Oe,itemHeight:N,onSelectionChange:De,paths:z,renderRowDecoration:T,search:!1,stickyFolders:!0,unsafeCSS:je},t[24]=pe,t[25]=j,t[26]=s,t[27]=De,t[28]=d,t[29]=N,t[30]=T,t[31]=Oe,t[32]=je,t[33]=z,t[34]=Me):Me=t[34];let{model:V}=Pa(Me),Ne;t[35]===d?Ne=t[36]:(Ne=d??[],t[35]=d,t[36]=Ne);let Pe;t[37]!==V||t[38]!==E||t[39]!==Ne||t[40]!==z?(Pe={initialExpandedPaths:Ne,model:V,resetKey:E,treePaths:z},t[37]=V,t[38]=E,t[39]=Ne,t[40]=z,t[41]=Pe):Pe=t[41];let Fe=(0,ho.useRef)(Pe),Ie,Le;t[42]!==d||t[43]!==V||t[44]!==E||t[45]!==z?(Ie=()=>{let e=Array.from(d??[]),t=Fe.current;if(t.model===V&&t.resetKey===E&&eo(t.treePaths,z)&&eo(t.initialExpandedPaths,e))return;let n=t.model!==V||t.resetKey!==E;Fe.current={initialExpandedPaths:e,model:V,resetKey:E,treePaths:Array.from(z)},ve.current=e,V.resetPaths(z,{initialExpandedPaths:d});let r=ye.current?.path;(n||r!=null&&V.getItem(r)==null)&&(ye.current=null)},Le=[d,V,E,z],t[42]=d,t[43]=V,t[44]=E,t[45]=z,t[46]=Ie,t[47]=Le):(Ie=t[46],Le=t[47]),(0,ho.useEffect)(Ie,Le);let Re,ze;t[48]!==M||t[49]!==V||t[50]!==P||t[51]!==D?(Re=()=>{let e=null,t=0,n=()=>{e=null,!fo(V,M)&&(t>=vo||(t+=1,e=window.requestAnimationFrame(n)))};return M>0&&!(P&&D!=null)?(be.current=M,n()):be.current=0,()=>{e!=null&&window.cancelAnimationFrame(e)}},ze=[M,V,P,D],t[48]=M,t[49]=V,t[50]=P,t[51]=D,t[52]=Re,t[53]=ze):(Re=t[52],ze=t[53]),(0,ho.useEffect)(Re,ze);let Be;t[54]!==V||t[55]!==P||t[56]!==F||t[57]!==D?(Be=()=>{if(xe.current=D??null,so(V,D),!P||D==null){ye.current=null;return}(ye.current?.path!==D||ye.current.scrollOffset!==F)&&co(V,D,F)&&(ye.current={path:D,scrollOffset:F})},t[54]=V,t[55]=P,t[56]=F,t[57]=D,t[58]=Be):Be=t[58];let H;t[59]!==V||t[60]!==E||t[61]!==P||t[62]!==F||t[63]!==D||t[64]!==z?(H=[V,P,F,E,D,z],t[59]=V,t[60]=E,t[61]=P,t[62]=F,t[63]=D,t[64]=z,t[65]=H):H=t[65],(0,ho.useEffect)(Be,H);let Ve,He;t[66]!==s||t[67]!==V?(Ve=()=>{V.setGitStatus(s)},He=[s,V],t[66]=s,t[67]=V,t[68]=Ve,t[69]=He):(Ve=t[68],He=t[69]),(0,ho.useEffect)(Ve,He);let Ue,We;t[70]!==pe||t[71]!==V?(Ue=()=>{V.setIcons(pe)},We=[pe,V],t[70]=pe,t[71]=V,t[72]=Ue,t[73]=We):(Ue=t[72],We=t[73]),(0,ho.useEffect)(Ue,We);let Ge,Ke;t[74]!==Te||t[75]!==V||t[76]!==z?(Ge=()=>V.subscribe(()=>{be.current=uo(V),Te(oo(V,z))}),Ke=[Te,V,z],t[74]=Te,t[75]=V,t[76]=z,t[77]=Ge,t[78]=Ke):(Ge=t[77],Ke=t[78]),(0,ho.useEffect)(Ge,Ke);let qe,Je;t[79]!==V||t[80]!==Ce?(qe=()=>{let e=null,t=0,n=null,r=()=>{e=null;let i=lo(V);if(i!=null){let e=()=>{be.current=i.scrollTop,Ce()};i.addEventListener(`scroll`,e,{passive:!0}),n=()=>{i.removeEventListener(`scroll`,e)};return}t>=vo||(t+=1,e=window.requestAnimationFrame(r))};return r(),()=>{e!=null&&window.cancelAnimationFrame(e),n?.()}},Je=[V,Ce],t[79]=V,t[80]=Ce,t[81]=qe,t[82]=Je):(qe=t[81],Je=t[82]),(0,ho.useEffect)(qe,Je);let U;t[83]!==A||t[84]!==n||t[85]!==c?(U=A?(0,go.jsx)(Ae,{cwd:n,hostId:c}):null,t[83]=A,t[84]=n,t[85]=c,t[86]=U):U=t[86];let W;t[87]!==se||t[88]!==A||t[89]!==n||t[90]!==le||t[91]!==c||t[92]!==I||t[93]!==ne||t[94]!==de?(W=()=>{if(!A)return[];let e=Va({cwd:n,isWindowsHost:I===`windows`,itemPath:ge.current,targetPathByDisplayPath:de});return La({...io({scope:ne,cwd:n,fallbackOpenTargets:le,hostId:c,targetPath:e}),onAddToChat:c==null?void 0:e=>{se.mutateAsync({hostId:c,path:e})},onCopyPath:x,onOpenInTarget:(e,t,n)=>{le.open(e,{appPath:t,persistPreferred:!1,path:n})},onSaveAs:B.workspaceFiles.saveCopy==null?void 0:e=>{B.workspaceFiles.saveCopy?.({hostId:c??`local`,path:e}).catch(Qa)},targetPath:e})},t[87]=se,t[88]=A,t[89]=n,t[90]=le,t[91]=c,t[92]=I,t[93]=ne,t[94]=de,t[95]=W):W=t[95];let Xe;t[96]!==A||t[97]!==n||t[98]!==c||t[99]!==I||t[100]!==ne||t[101]!==de?(Xe=()=>{if(A)return ao({scope:ne,cwd:n,hostId:c,targetPath:Va({cwd:n,isWindowsHost:I===`windows`,itemPath:ge.current,targetPathByDisplayPath:de})})},t[96]=A,t[97]=n,t[98]=c,t[99]=I,t[100]=ne,t[101]=de,t[102]=Xe):Xe=t[102];let Ze;t[103]===Symbol.for(`react.memo_cache_sentinel`)?(Ze=e=>{ge.current=Ua(e.nativeEvent)},t[103]=Ze):Ze=t[103];let Qe;t[104]===oe?Qe=t[105]:(Qe={backgroundColor:`var(--color-surface)`,color:`var(--color-text)`,colorScheme:oe,width:`100%`},t[104]=oe,t[105]=Qe);let $e;t[106]!==V||t[107]!==h||t[108]!==g||t[109]!==Qe?($e=(0,go.jsx)(Ye,{"data-tab-preview-pin-exempt":!0,onClick:h,onContextMenu:Ze,onDoubleClick:g,model:V,style:Qe}),t[106]=V,t[107]=h,t[108]=g,t[109]=Qe,t[110]=$e):$e=t[110];let et;t[111]!==W||t[112]!==Xe||t[113]!==$e?(et=(0,go.jsx)(a,{awaitBeforeOpen:!1,getItems:W,onBeforeOpen:Xe,children:$e}),t[111]=W,t[112]=Xe,t[113]=$e,t[114]=et):et=t[114];let tt;return t[115]!==U||t[116]!==et?(tt=(0,go.jsxs)(go.Fragment,{children:[U,et]}),t[115]=U,t[116]=et,t[117]=tt):tt=t[117],tt}function Qa(e){p.warning(`Workspace file save failed`,{safe:{},sensitive:{error:e}})}function $a(e){return typeof e==`string`?e:e.displayPath}function eo(e,t){return e.length===t.length&&e.every((e,n)=>e===t[n])}function to(e){return`data:image/svg+xml,${encodeURIComponent(e)}`}function no(e,t){if(t==null||t.length===0)return e;let n=t.map(e=>`<symbol id="${e.name}" viewBox="${e.viewBox??`0 0 ${e.width??0} ${e.height??0}`}">${e.body}</symbol>`).join(``),r=ro(typeof e==`string`?void 0:e?.spriteSheet,n);return e==null?{set:`complete`,spriteSheet:r}:typeof e==`string`?{set:e,spriteSheet:r}:{...e,spriteSheet:r}}function ro(e,t){return e==null?`<svg data-icon-sprite aria-hidden="true" width="0" height="0" xmlns="http://www.w3.org/2000/svg">${t}</svg>`:e.replace(`</svg>`,`${t}</svg>`)}function io({scope:e,cwd:t,fallbackOpenTargets:n,hostId:r,targetPath:i}){if(i==null)return{isLoadingOpenTargets:!1,primaryTarget:null,visibleTargets:[]};let a=e.query.snapshot(Ee,{cwd:t,hostId:r,path:i}),o=a.getData(),s=o?.targets??n.targets,c=o?.availableTargets??n.availableTargets,l=o?.preferredTarget??n.preferredTarget,u=o?.mode??n.mode;return{isLoadingOpenTargets:o==null&&!n.hasLoadedTargets&&e.queryClient.getQueryState(a.queryKey)?.status!==`error`,primaryTarget:ge({preferredTarget:l,targets:s,availableTargets:c,mode:u}),visibleTargets:z({targets:s,availableTargets:c,includeHiddenTargets:!0,mode:u})}}function ao({scope:e,cwd:t,hostId:r,targetPath:i}){if(i!=null)return e.queryClient.prefetchQuery({...e.query.getOptions(Ee,{cwd:t,hostId:r,path:i}),gcTime:n.INFINITE})}function oo(e,t){let n=[];for(let r of t){if(!r.endsWith(`/`))continue;let t=r.slice(0,-1),i=e.getItem(t);i!=null&&po(i)&&i.isExpanded()&&n.push(t)}return n}function so(e,t){let n=e.getSelectedPaths();if(t==null){for(let t of n)e.getItem(t)?.deselect();return}if(n.length!==1||n[0]!==t){for(let t of n)e.getItem(t)?.deselect();e.getItem(t)?.select()}}function co(e,t,n){return e.getItem(t)!=null&&(e.scrollToPath(t,{offset:n}),!0)}function lo(e){return e.getFileTreeContainer()?.shadowRoot?.querySelector(`[data-file-tree-virtualized-scroll='true']`)??null}function uo(e){return lo(e)?.scrollTop??0}function fo(e,t){let n=lo(e);return n!=null&&(n.scrollTop=Math.max(0,t),!0)}function po(e){return e.isDirectory()}var mo,ho,go,_o,vo,yo,bo,xo;function So(){return(So=e((()=>{mo=t(),Ze(),Ia(),o(),ho=E(),d(),Ha(),le(),L(),Ka(),Ja(),Xa(),Te(),Oe(),_e(),pe(),re(),De(),v(),S(),m(),D(),O(),ve(),go=c(),_o=28,vo=60,yo=to(Ga),bo=to(qa),xo=to(Ya)})))()}function Co(e){let t=(0,wo.c)(23),{autoFocus:n,inputId:i,inputRef:a,onQueryChange:o,searchQuery:s}=e,c=i===void 0?`file-tree-search`:i,l=j(),u;t[0]===Symbol.for(`react.memo_cache_sentinel`)?(u=(0,To.jsx)(y,{id:`codex.fileTreeSearch.label`,defaultMessage:`Filter files`,description:`Label for a file tree filter input`}),t[0]=u):u=t[0];let d;t[1]===c?d=t[2]:(d=(0,To.jsx)(`label`,{className:`sr-only`,htmlFor:c,children:u}),t[1]=c,t[2]=d);let f;t[3]===Symbol.for(`react.memo_cache_sentinel`)?(f=(0,To.jsx)(h,{className:`ms-2 shrink-0 text-tertiary`,"aria-hidden":!1,asset:r}),t[3]=f):f=t[3];let p;t[4]===o?p=t[5]:(p=e=>o(e.target.value),t[4]=o,t[5]=p);let m;t[6]===l?m=t[7]:(m=l.formatMessage({id:`codex.fileTreeSearch.placeholder`,defaultMessage:`Filter files…`,description:`Placeholder text for a file tree filter input`}),t[6]=l,t[7]=m);let g;t[8]!==n||t[9]!==c||t[10]!==a||t[11]!==s||t[12]!==p||t[13]!==m?(g=(0,To.jsx)(`input`,{autoFocus:n,id:c,ref:a,className:`w-full appearance-none border-none bg-transparent py-0 ps-0 pe-1.5 text-default ring-0 outline-none select-text placeholder:text-tertiary focus:border-none focus:ring-0 focus:outline-none [&::placeholder]:select-none`,type:`text`,value:s,onChange:p,placeholder:m}),t[8]=n,t[9]=c,t[10]=a,t[11]=s,t[12]=p,t[13]=m,t[14]=g):g=t[14];let _;t[15]!==l||t[16]!==o||t[17]!==s.length?(_=s.length>0?(0,To.jsx)(b,{"aria-label":l.formatMessage({id:`codex.fileTreeSearch.clear`,defaultMessage:`Clear file filter`,description:`Button label to clear a file tree filter input`}),className:`text-tertiary hover:text-default`,color:`ghost`,size:`icon`,onClick:()=>o(``),children:(0,To.jsx)(A,{className:`icon-2xs`})}):null,t[15]=l,t[16]=o,t[17]=s.length,t[18]=_):_=t[18];let v;return t[19]!==d||t[20]!==g||t[21]!==_?(v=(0,To.jsxs)(`div`,{className:`relative flex h-token-button-composer w-full items-center gap-1.5 rounded-lg border border-default bg-primary-soft-alpha text-base leading-[18px]`,children:[d,f,g,_]}),t[19]=d,t[20]=g,t[21]=_,t[22]=v):v=t[22],v}var wo,To;function Eo(){return(Eo=e((()=>{wo=t(),F(),l(),C(),i(),T(),To=c()})))()}var Do,Oo,ko;function Ao(){return(Ao=e((()=>{Do=(e,t,n)=>{let r=e instanceof RegExp?Oo(e,n):e,i=t instanceof RegExp?Oo(t,n):t,a=r!==null&&i!=null&&ko(r,i,n);return a&&{start:a[0],end:a[1],pre:n.slice(0,a[0]),body:n.slice(a[0]+r.length,a[1]),post:n.slice(a[1]+i.length)}},Oo=(e,t)=>{let n=t.match(e);return n?n[0]:null},ko=(e,t,n)=>{let r,i,a,o,s,c=n.indexOf(e),l=n.indexOf(t,c+1),u=c;if(c>=0&&l>0){if(e===t)return[c,l];for(r=[],a=n.length;u>=0&&!s;){if(u===c)r.push(u),c=n.indexOf(e,u+1);else if(r.length===1){let e=r.pop();e!==void 0&&(s=[e,l])}else i=r.pop(),i!==void 0&&i<a&&(a=i,o=l),l=n.indexOf(t,u+1);u=c<l&&c>=0?c:l}r.length&&o!==void 0&&(s=[a,o])}return s}})))()}function jo(e){return isNaN(e)?e.charCodeAt(0):parseInt(e,10)}function Mo(e){return e.replace(Zo,Vo).replace(Qo,Ho).replace($o,Uo).replace(es,Wo).replace(ts,Go)}function No(e){return e.replace(Ko,`\\`).replace(qo,`{`).replace(Jo,`}`).replace(Yo,`,`).replace(Xo,`.`)}function Po(e){if(!e)return[``];let t=[],n=Do(`{`,`}`,e);if(!n)return e.split(`,`);let{pre:r,body:i,post:a}=n,o=r.split(`,`);o[o.length-1]+=`{`+i+`}`;let s=Po(a);return a.length&&(o[o.length-1]+=s.shift(),o.push.apply(o,s)),t.push.apply(t,o),t}function Fo(e,t={}){if(!e)return[];let{max:n=ns}=t;return e.slice(0,2)===`{}`&&(e=`\\{\\}`+e.slice(2)),Bo(Mo(e),n,!0).map(No)}function Io(e){return`{`+e+`}`}function Lo(e){return/^-?0\d/.test(e)}function Ro(e,t){return e<=t}function zo(e,t){return e>=t}function Bo(e,t,n){let r=[];for(;;){let i=Do(`{`,`}`,e);if(!i)return[e];let a=i.pre;if(/\$$/.test(i.pre)){let e=i.post.length?Bo(i.post,t,!1):[``];for(let n=0;n<e.length&&n<t;n++){let t=a+`{`+i.body+`}`+e[n];r.push(t)}return r}let o=/^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(i.body),s=/^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(i.body),c=o||s,l=i.body.indexOf(`,`)>=0;if(!c&&!l){if(i.post.match(/,(?!,).*\}/)){e=i.pre+`{`+i.body+Uo+i.post,n=!0;continue}return[e]}let u=i.post.length?Bo(i.post,t,!1):[``],d;if(c)d=i.body.split(/\.\./);else if(d=Po(i.body),d.length===1&&d[0]!==void 0&&(d=Bo(d[0],t,!1).map(Io),d.length===1))return u.map(e=>i.pre+d[0]+e);let f;if(c&&d[0]!==void 0&&d[1]!==void 0){let e=jo(d[0]),n=jo(d[1]),r=Math.max(d[0].length,d[1].length),i=d.length===3&&d[2]!==void 0?Math.max(Math.abs(jo(d[2])),1):1,a=Ro;n<e&&(i*=-1,a=zo);let o=d.some(Lo);f=[];for(let c=e;a(c,n)&&f.length<t;c+=i){let e;if(s)e=String.fromCharCode(c),e===`\\`&&(e=``);else if(e=String(c),o){let t=r-e.length;if(t>0){let n=Array(t+1).join(`0`);e=c<0?`-`+n+e.slice(1):n+e}}f.push(e)}}else{f=[];for(let e=0;e<d.length;e++)f.push.apply(f,Bo(d[e],t,!1))}for(let e=0;e<f.length;e++)for(let i=0;i<u.length&&r.length<t;i++){let t=a+f[e]+u[i];(!n||c||t)&&r.push(t)}return r}}var Vo,Ho,Uo,Wo,Go,Ko,qo,Jo,Yo,Xo,Zo,Qo,$o,es,ts,ns;function rs(){return(rs=e((()=>{Ao(),Vo=`\0SLASH`+Math.random()+`\0`,Ho=`\0OPEN`+Math.random()+`\0`,Uo=`\0CLOSE`+Math.random()+`\0`,Wo=`\0COMMA`+Math.random()+`\0`,Go=`\0PERIOD`+Math.random()+`\0`,Ko=new RegExp(Vo,`g`),qo=new RegExp(Ho,`g`),Jo=new RegExp(Uo,`g`),Yo=new RegExp(Wo,`g`),Xo=new RegExp(Go,`g`),Zo=/\\\\/g,Qo=/\\{/g,$o=/\\}/g,es=/\\,/g,ts=/\\\./g,ns=1e5})))()}var is,as;function os(){return(os=e((()=>{is=65536,as=e=>{if(typeof e!=`string`)throw TypeError(`invalid pattern`);if(e.length>is)throw TypeError(`pattern is too long`)}})))()}var ss,cs,ls,us,ds;function fs(){return(fs=e((()=>{ss={"[:alnum:]":[`\\p{L}\\p{Nl}\\p{Nd}`,!0],"[:alpha:]":[`\\p{L}\\p{Nl}`,!0],"[:ascii:]":[`\\x00-\\x7f`,!1],"[:blank:]":[`\\p{Zs}\\t`,!0],"[:cntrl:]":[`\\p{Cc}`,!0],"[:digit:]":[`\\p{Nd}`,!0],"[:graph:]":[`\\p{Z}\\p{C}`,!0,!0],"[:lower:]":[`\\p{Ll}`,!0],"[:print:]":[`\\p{C}`,!0],"[:punct:]":[`\\p{P}`,!0],"[:space:]":[`\\p{Z}\\t\\r\\n\\v\\f`,!0],"[:upper:]":[`\\p{Lu}`,!0],"[:word:]":[`\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}`,!0],"[:xdigit:]":[`A-Fa-f0-9`,!1]},cs=e=>e.replace(/[[\]\\-]/g,`\\$&`),ls=e=>e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,`\\$&`),us=e=>e.join(``),ds=(e,t)=>{let n=t;if(e.charAt(n)!==`[`)throw Error(`not in a brace expression`);let r=[],i=[],a=n+1,o=!1,s=!1,c=!1,l=!1,u=n,d=``;WHILE:for(;a<e.length;){let t=e.charAt(a);if((t===`!`||t===`^`)&&a===n+1){l=!0,a++;continue}if(t===`]`&&o&&!c){u=a+1;break}if(o=!0,t===`\\`&&!c){c=!0,a++;continue}if(t===`[`&&!c){for(let[t,[o,c,l]]of Object.entries(ss))if(e.startsWith(t,a)){if(d)return[`$.`,!1,e.length-n,!0];a+=t.length,l?i.push(o):r.push(o),s||=c;continue WHILE}}if(c=!1,d){t>d?r.push(cs(d)+`-`+cs(t)):t===d&&r.push(cs(t)),d=``,a++;continue}if(e.startsWith(`-]`,a+1)){r.push(cs(t+`-`)),a+=2;continue}if(e.startsWith(`-`,a+1)){d=t,a+=2;continue}r.push(cs(t)),a++}if(u<a)return[``,!1,0,!1];if(!r.length&&!i.length)return[`$.`,!1,e.length-n,!0];if(i.length===0&&r.length===1&&/^\\?.$/.test(r[0])&&!l){let e=r[0].length===2?r[0].slice(-1):r[0];return[ls(e),!1,u-n,!1]}let f=`[`+(l?`^`:``)+us(r)+`]`,p=`[`+(l?``:`^`)+us(i)+`]`;return[r.length&&i.length?`(`+f+`|`+p+`)`:r.length?f:p,s,u-n,!0]}})))()}var ps;function ms(){return(ms=e((()=>{ps=(e,{windowsPathsNoEscape:t=!1,magicalBraces:n=!0}={})=>n?t?e.replace(/\[([^/\\])\]/g,`$1`):e.replace(/((?!\\).|^)\[([^/\\])\]/g,`$1$2`).replace(/\\([^/])/g,`$1`):t?e.replace(/\[([^/\\{}])\]/g,`$1`):e.replace(/((?!\\).|^)\[([^/\\{}])\]/g,`$1$2`).replace(/\\([^/{}])/g,`$1`)})))()}var hs,gs,_s,vs,ys,bs,xs,Ss,Cs,ws,Ts,Es,Ds,Os,ks,As,js,Ms,Ns;function Ps(){return(Ps=e((()=>{fs(),ms(),gs=new Set([`!`,`?`,`+`,`*`,`@`]),_s=e=>gs.has(e),vs=e=>_s(e.type),ys=new Map([[`!`,[`@`]],[`?`,[`?`,`@`]],[`@`,[`@`]],[`*`,[`*`,`+`,`?`,`@`]],[`+`,[`+`,`@`]]]),bs=new Map([[`!`,[`?`]],[`@`,[`?`]],[`+`,[`?`,`*`]]]),xs=new Map([[`!`,[`?`,`@`]],[`?`,[`?`,`@`]],[`@`,[`?`,`@`]],[`*`,[`*`,`+`,`?`,`@`]],[`+`,[`+`,`@`,`?`,`*`]]]),Ss=new Map([[`!`,new Map([[`!`,`@`]])],[`?`,new Map([[`*`,`*`],[`+`,`*`]])],[`@`,new Map([[`!`,`!`],[`?`,`?`],[`@`,`@`],[`*`,`*`],[`+`,`+`]])],[`+`,new Map([[`?`,`*`],[`*`,`*`]])]]),Cs=`(?!(?:^|/)\\.\\.?(?:$|/))`,ws=`(?!\\.)`,Ts=new Set([`[`,`.`]),Es=new Set([`..`,`.`]),Ds=new Set(`().*{}+?[]^$\\!`),Os=e=>e.replace(/[[\]{}()*+?.\\^$|]/g,`\\$&`),ks=`[^/]`,As=`[^/]*?`,js=`[^/]+?`,Ms=0,Ns=class{type;#e;#t;#n=!1;#r=[];#i;#a;#o;#s=!1;#c;#l;#u=!1;id=++Ms;get depth(){return(this.#i?.depth??-1)+1}[Symbol.for(`nodejs.util.inspect.custom`)](){return{"@@type":`AST`,id:this.id,type:this.type,root:this.#e.id,parent:this.#i?.id,depth:this.depth,partsLength:this.#r.length,parts:this.#r}}constructor(e,t,n={}){this.type=e,e&&(this.#t=!0),this.#i=t,this.#e=this.#i?this.#i.#e:this,this.#c=this.#e===this?n:this.#e.#c,this.#o=this.#e===this?[]:this.#e.#o,e===`!`&&!this.#e.#s&&this.#o.push(this),this.#a=this.#i?this.#i.#r.length:0}get hasMagic(){if(this.#t!==void 0)return this.#t;for(let e of this.#r)if(typeof e!=`string`&&(e.type||e.hasMagic))return this.#t=!0;return this.#t}toString(){return this.#l===void 0?this.#l=this.type?this.type+`(`+this.#r.map(e=>String(e)).join(`|`)+`)`:this.#r.map(e=>String(e)).join(``):this.#l}#d(){if(this!==this.#e)throw Error(`should only call on root`);if(this.#s)return this;this.toString(),this.#s=!0;let e;for(;e=this.#o.pop();){if(e.type!==`!`)continue;let t=e,n=t.#i;for(;n;){for(let r=t.#a+1;!n.type&&r<n.#r.length;r++)for(let t of e.#r){if(typeof t==`string`)throw Error(`string part in extglob AST??`);t.copyIn(n.#r[r])}t=n,n=t.#i}}return this}push(...e){for(let t of e)if(t!==``){if(typeof t!=`string`&&!(t instanceof hs&&t.#i===this))throw Error(`invalid part: `+t);this.#r.push(t)}}toJSON(){let e=this.type===null?this.#r.slice().map(e=>typeof e==`string`?e:e.toJSON()):[this.type,...this.#r.map(e=>e.toJSON())];return this.isStart()&&!this.type&&e.unshift([]),this.isEnd()&&(this===this.#e||this.#e.#s&&this.#i?.type===`!`)&&e.push({}),e}isStart(){if(this.#e===this)return!0;if(!this.#i?.isStart())return!1;if(this.#a===0)return!0;let e=this.#i;for(let t=0;t<this.#a;t++){let n=e.#r[t];if(!(n instanceof hs&&n.type===`!`))return!1}return!0}isEnd(){if(this.#e===this||this.#i?.type===`!`)return!0;if(!this.#i?.isEnd())return!1;if(!this.type)return this.#i?.isEnd();let e=this.#i?this.#i.#r.length:0;return this.#a===e-1}copyIn(e){typeof e==`string`?this.push(e):this.push(e.clone(this))}clone(e){let t=new hs(this.type,e);for(let e of this.#r)t.copyIn(e);return t}static#f(e,t,n,r,i){let a=r.maxExtglobRecursion??2,o=!1,s=!1,c=-1,l=!1;if(t.type===null){let u=n,d=``;for(;u<e.length;){let n=e.charAt(u++);if(o||n===`\\`){o=!o,d+=n;continue}if(s){u===c+1?(n===`^`||n===`!`)&&(l=!0):n===`]`&&!(u===c+2&&l)&&(s=!1),d+=n;continue}if(n===`[`){s=!0,c=u,l=!1,d+=n;continue}if(!r.noext&&_s(n)&&e.charAt(u)===`(`&&i<=a){t.push(d),d=``;let a=new hs(n,t);u=hs.#f(e,a,u,r,i+1),t.push(a);continue}d+=n}return t.push(d),u}let u=n+1,d=new hs(null,t),f=[],p=``;for(;u<e.length;){let n=e.charAt(u++);if(o||n===`\\`){o=!o,p+=n;continue}if(s){u===c+1?(n===`^`||n===`!`)&&(l=!0):n===`]`&&!(u===c+2&&l)&&(s=!1),p+=n;continue}if(n===`[`){s=!0,c=u,l=!1,p+=n;continue}if(!r.noext&&_s(n)&&e.charAt(u)===`(`&&(i<=a||t&&t.#h(n))){let a=t&&t.#h(n)?0:1;d.push(p),p=``;let o=new hs(n,d);d.push(o),u=hs.#f(e,o,u,r,i+a);continue}if(n===`|`){d.push(p),p=``,f.push(d),d=new hs(null,t);continue}if(n===`)`)return p===``&&t.#r.length===0&&(t.#u=!0),d.push(p),p=``,t.push(...f,d),u;p+=n}return t.type=null,t.#t=void 0,t.#r=[e.substring(n-1)],u}#p(e){return this.#m(e,bs)}#m(e,t=ys){if(!e||typeof e!=`object`||e.type!==null||e.#r.length!==1||this.type===null)return!1;let n=e.#r[0];return!n||typeof n!=`object`||n.type===null?!1:this.#h(n.type,t)}#h(e,t=xs){return!!t.get(this.type)?.includes(e)}#g(e,t){let n=e.#r[0],r=new hs(null,n,this.options);r.#r.push(``),n.push(r),this.#_(e,t)}#_(e,t){let n=e.#r[0];this.#r.splice(t,1,...n.#r);for(let e of n.#r)typeof e==`object`&&(e.#i=this);this.#l=void 0}#v(e){return!!Ss.get(this.type)?.has(e)}#y(e){if(!e||typeof e!=`object`||e.type!==null||e.#r.length!==1||this.type===null||this.#r.length!==1)return!1;let t=e.#r[0];return!t||typeof t!=`object`||t.type===null?!1:this.#v(t.type)}#b(e){let t=Ss.get(this.type),n=e.#r[0],r=t?.get(n.type);if(!r)return!1;this.#r=n.#r;for(let e of this.#r)typeof e==`object`&&(e.#i=this);this.type=r,this.#l=void 0,this.#u=!1}static fromGlob(e,t={}){let n=new hs(null,void 0,t);return hs.#f(e,n,0,t,0),n}toMMPattern(){if(this!==this.#e)return this.#e.toMMPattern();let e=this.toString(),[t,n,r,i]=this.toRegExpSource();if(!(r||this.#t||this.#c.nocase&&!this.#c.nocaseMagicOnly&&e.toUpperCase()!==e.toLowerCase()))return n;let a=(this.#c.nocase?`i`:``)+(i?`u`:``);return Object.assign(RegExp(`^${t}$`,a),{_src:t,_glob:e})}get options(){return this.#c}toRegExpSource(e){let t=e??!!this.#c.dot;if(this.#e===this&&(this.#x(),this.#d()),!vs(this)){let n=this.isStart()&&this.isEnd()&&!this.#r.some(e=>typeof e!=`string`),r=this.#r.map(t=>{let[r,i,a,o]=typeof t==`string`?hs.#C(t,this.#t,n):t.toRegExpSource(e);return this.#t=this.#t||a,this.#n=this.#n||o,r}).join(``),i=``;if(this.isStart()&&typeof this.#r[0]==`string`&&!(this.#r.length===1&&Es.has(this.#r[0]))){let n=Ts,a=t&&n.has(r.charAt(0))||r.startsWith(`\\.`)&&n.has(r.charAt(2))||r.startsWith(`\\.\\.`)&&n.has(r.charAt(4)),o=!t&&!e&&n.has(r.charAt(0));i=a?Cs:o?ws:``}let a=``;return this.isEnd()&&this.#e.#s&&this.#i?.type===`!`&&(a=`(?:$|\\/)`),[i+r+a,ps(r),this.#t=!!this.#t,this.#n]}let n=this.type===`*`||this.type===`+`,r=this.type===`!`?`(?:(?!(?:`:`(?:`,i=this.#S(t);if(this.isStart()&&this.isEnd()&&!i&&this.type!==`!`){let e=this.toString(),t=this;return t.#r=[e],t.type=null,t.#t=void 0,[e,ps(this.toString()),!1,!1]}let a=!n||e||t?``:this.#S(!0);a===i&&(a=``),a&&(i=`(?:${i})(?:${a})*?`);let o=``;if(this.type===`!`&&this.#u)o=(this.isStart()&&!t?ws:``)+js;else{let n=this.type===`!`?`))`+(this.isStart()&&!t&&!e?ws:``)+`[^/]*?)`:this.type===`@`?`)`:this.type===`?`?`)?`:this.type===`+`&&a?`)`:this.type===`*`&&a?`)?`:`)${this.type}`;o=r+i+n}return[o,ps(i),this.#t=!!this.#t,this.#n]}#x(){if(vs(this)){let e=0,t=!1;do{t=!0;for(let e=0;e<this.#r.length;e++){let n=this.#r[e];typeof n==`object`&&(n.#x(),this.#m(n)?(t=!1,this.#_(n,e)):this.#p(n)?(t=!1,this.#g(n,e)):this.#y(n)&&(t=!1,this.#b(n)))}}while(!t&&++e<10)}else for(let e of this.#r)typeof e==`object`&&e.#x();this.#l=void 0}#S(e){return this.#r.map(t=>{if(typeof t==`string`)throw Error(`string type in extglob ast??`);let[n,r,i,a]=t.toRegExpSource(e);return this.#n=this.#n||a,n}).filter(e=>!(this.isStart()&&this.isEnd())||!!e).join(`|`)}static#C(e,t,n=!1){let r=!1,i=``,a=!1,o=!1;for(let s=0;s<e.length;s++){let c=e.charAt(s);if(r){r=!1,i+=(Ds.has(c)?`\\`:``)+c;continue}if(c===`*`){if(o)continue;o=!0,i+=n&&/^[*]+$/.test(e)?js:As,t=!0;continue}if(o=!1,c===`\\`){s===e.length-1?i+=`\\\\`:r=!0;continue}if(c===`[`){let[n,r,o,c]=ds(e,s);if(o){i+=n,a||=r,s+=o-1,t||=c;continue}}if(c===`?`){i+=ks,t=!0;continue}i+=Os(c)}return[i,ps(e),!!t,a]}},hs=Ns})))()}var Fs;function Is(){return(Is=e((()=>{Fs=(e,{windowsPathsNoEscape:t=!1,magicalBraces:n=!1}={})=>n?t?e.replace(/[?*()[\]{}]/g,`[$&]`):e.replace(/[?*()[\]\\{}]/g,`\\$&`):t?e.replace(/[?*()[\]]/g,`[$&]`):e.replace(/[?*()[\]\\]/g,`\\$&`)})))()}var Ls,Rs,zs,Bs,Vs,Hs,Us,Ws,Gs,Ks,qs,Js,Ys,Xs,Zs,Qs,$s,ec,tc,nc,rc,ic,ac,oc,sc,cc,lc,uc,dc,fc,pc,mc,hc,gc,_c,vc,yc;function bc(){return(bc=e((()=>{rs(),os(),Ps(),Is(),ms(),Ls=(e,t,n={})=>(as(t),!n.nocomment&&t.charAt(0)===`#`?!1:new yc(t,n).match(e)),Rs=/^\*+([^+@!?*[(]*)$/,zs=e=>t=>!t.startsWith(`.`)&&t.endsWith(e),Bs=e=>t=>t.endsWith(e),Vs=e=>(e=e.toLowerCase(),t=>!t.startsWith(`.`)&&t.toLowerCase().endsWith(e)),Hs=e=>(e=e.toLowerCase(),t=>t.toLowerCase().endsWith(e)),Us=/^\*+\.\*+$/,Ws=e=>!e.startsWith(`.`)&&e.includes(`.`),Gs=e=>e!==`.`&&e!==`..`&&e.includes(`.`),Ks=/^\.\*+$/,qs=e=>e!==`.`&&e!==`..`&&e.startsWith(`.`),Js=/^\*+$/,Ys=e=>e.length!==0&&!e.startsWith(`.`),Xs=e=>e.length!==0&&e!==`.`&&e!==`..`,Zs=/^\?+([^+@!?*[(]*)?$/,Qs=([e,t=``])=>{let n=nc([e]);return t?(t=t.toLowerCase(),e=>n(e)&&e.toLowerCase().endsWith(t)):n},$s=([e,t=``])=>{let n=rc([e]);return t?(t=t.toLowerCase(),e=>n(e)&&e.toLowerCase().endsWith(t)):n},ec=([e,t=``])=>{let n=rc([e]);return t?e=>n(e)&&e.endsWith(t):n},tc=([e,t=``])=>{let n=nc([e]);return t?e=>n(e)&&e.endsWith(t):n},nc=([e])=>{let t=e.length;return e=>e.length===t&&!e.startsWith(`.`)},rc=([e])=>{let t=e.length;return e=>e.length===t&&e!==`.`&&e!==`..`},ic=typeof process==`object`&&process?{}.__MINIMATCH_TESTING_PLATFORM__||process.platform:`posix`,ac={win32:{sep:`\\`},posix:{sep:`/`}},oc=ic===`win32`?ac.win32.sep:ac.posix.sep,Ls.sep=oc,sc=Symbol(`globstar **`),Ls.GLOBSTAR=sc,cc=`[^/]*?`,lc=`(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?`,uc=`(?:(?!(?:\\/|^)\\.).)*?`,dc=(e,t={})=>n=>Ls(n,e,t),Ls.filter=dc,fc=(e,t={})=>Object.assign({},e,t),pc=e=>{if(!e||typeof e!=`object`||!Object.keys(e).length)return Ls;let t=Ls;return Object.assign((n,r,i={})=>t(n,r,fc(e,i)),{Minimatch:class extends t.Minimatch{constructor(t,n={}){super(t,fc(e,n))}static defaults(n){return t.defaults(fc(e,n)).Minimatch}},AST:class extends t.AST{constructor(t,n,r={}){super(t,n,fc(e,r))}static fromGlob(n,r={}){return t.AST.fromGlob(n,fc(e,r))}},unescape:(n,r={})=>t.unescape(n,fc(e,r)),escape:(n,r={})=>t.escape(n,fc(e,r)),filter:(n,r={})=>t.filter(n,fc(e,r)),defaults:n=>t.defaults(fc(e,n)),makeRe:(n,r={})=>t.makeRe(n,fc(e,r)),braceExpand:(n,r={})=>t.braceExpand(n,fc(e,r)),match:(n,r,i={})=>t.match(n,r,fc(e,i)),sep:t.sep,GLOBSTAR:sc})},Ls.defaults=pc,mc=(e,t={})=>(as(e),t.nobrace||!/\{(?:(?!\{).)*\}/.test(e)?[e]:Fo(e,{max:t.braceExpandMax})),Ls.braceExpand=mc,hc=(e,t={})=>new yc(e,t).makeRe(),Ls.makeRe=hc,gc=(e,t,n={})=>{let r=new yc(t,n);return e=e.filter(e=>r.match(e)),r.options.nonull&&!e.length&&e.push(t),e},Ls.match=gc,_c=/[?*]|[+@!]\(.*?\)|\[|\]/,vc=e=>e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,`\\$&`),yc=class{options;set;pattern;windowsPathsNoEscape;nonegate;negate;comment;empty;preserveMultipleSlashes;partial;globSet;globParts;nocase;isWindows;platform;windowsNoMagicRoot;maxGlobstarRecursion;regexp;constructor(e,t={}){as(e),t||={},this.options=t,this.maxGlobstarRecursion=t.maxGlobstarRecursion??200,this.pattern=e,this.platform=t.platform||ic,this.isWindows=this.platform===`win32`,this.windowsPathsNoEscape=!!t.windowsPathsNoEscape||t.allowWindowsEscape===!1,this.windowsPathsNoEscape&&(this.pattern=this.pattern.replace(/\\/g,`/`)),this.preserveMultipleSlashes=!!t.preserveMultipleSlashes,this.regexp=null,this.negate=!1,this.nonegate=!!t.nonegate,this.comment=!1,this.empty=!1,this.partial=!!t.partial,this.nocase=!!this.options.nocase,this.windowsNoMagicRoot=t.windowsNoMagicRoot===void 0?!!(this.isWindows&&this.nocase):t.windowsNoMagicRoot,this.globSet=[],this.globParts=[],this.set=[],this.make()}hasMagic(){if(this.options.magicalBraces&&this.set.length>1)return!0;for(let e of this.set)for(let t of e)if(typeof t!=`string`)return!0;return!1}debug(...e){}make(){let e=this.pattern,t=this.options;if(!t.nocomment&&e.charAt(0)===`#`){this.comment=!0;return}if(!e){this.empty=!0;return}this.parseNegate(),this.globSet=[...new Set(this.braceExpand())],t.debug&&(this.debug=(...e)=>console.error(...e)),this.debug(this.pattern,this.globSet);let n=this.globSet.map(e=>this.slashSplit(e));this.globParts=this.preprocess(n),this.debug(this.pattern,this.globParts);let r=this.globParts.map((e,t,n)=>{if(this.isWindows&&this.windowsNoMagicRoot){let t=e[0]===``&&e[1]===``&&(e[2]===`?`||!_c.test(e[2]))&&!_c.test(e[3]),n=/^[a-z]:/i.test(e[0]);if(t)return[...e.slice(0,4),...e.slice(4).map(e=>this.parse(e))];if(n)return[e[0],...e.slice(1).map(e=>this.parse(e))]}return e.map(e=>this.parse(e))});if(this.debug(this.pattern,r),this.set=r.filter(e=>e.indexOf(!1)===-1),this.isWindows)for(let e=0;e<this.set.length;e++){let t=this.set[e];t[0]===``&&t[1]===``&&this.globParts[e][2]===`?`&&typeof t[3]==`string`&&/^[a-z]:$/i.test(t[3])&&(t[2]=`?`)}this.debug(this.pattern,this.set)}preprocess(e){if(this.options.noglobstar)for(let t of e)for(let e=0;e<t.length;e++)t[e]===`**`&&(t[e]=`*`);let{optimizationLevel:t=1}=this.options;return t>=2?(e=this.firstPhasePreProcess(e),e=this.secondPhasePreProcess(e)):e=t>=1?this.levelOneOptimize(e):this.adjascentGlobstarOptimize(e),e}adjascentGlobstarOptimize(e){return e.map(e=>{let t=-1;for(;(t=e.indexOf(`**`,t+1))!==-1;){let n=t;for(;e[n+1]===`**`;)n++;n!==t&&e.splice(t,n-t)}return e})}levelOneOptimize(e){return e.map(e=>(e=e.reduce((e,t)=>{let n=e[e.length-1];return t===`**`&&n===`**`?e:t===`..`&&n&&n!==`..`&&n!==`.`&&n!==`**`?(e.pop(),e):(e.push(t),e)},[]),e.length===0?[``]:e))}levelTwoFileOptimize(e){Array.isArray(e)||(e=this.slashSplit(e));let t=!1;do{if(t=!1,!this.preserveMultipleSlashes){for(let n=1;n<e.length-1;n++){let r=e[n];(n!==1||r!==``||e[0]!==``)&&(r===`.`||r===``)&&(t=!0,e.splice(n,1),n--)}e[0]===`.`&&e.length===2&&(e[1]===`.`||e[1]===``)&&(t=!0,e.pop())}let n=0;for(;(n=e.indexOf(`..`,n+1))!==-1;){let r=e[n-1];r&&r!==`.`&&r!==`..`&&r!==`**`&&!(this.isWindows&&/^[a-z]:$/i.test(r))&&(t=!0,e.splice(n-1,2),n-=2)}}while(t);return e.length===0?[``]:e}firstPhasePreProcess(e){let t=!1;do{t=!1;for(let n of e){let r=-1;for(;(r=n.indexOf(`**`,r+1))!==-1;){let i=r;for(;n[i+1]===`**`;)i++;i>r&&n.splice(r+1,i-r);let a=n[r+1],o=n[r+2],s=n[r+3];if(a!==`..`||!o||o===`.`||o===`..`||!s||s===`.`||s===`..`)continue;t=!0,n.splice(r,1);let c=n.slice(0);c[r]=`**`,e.push(c),r--}if(!this.preserveMultipleSlashes){for(let e=1;e<n.length-1;e++){let r=n[e];(e!==1||r!==``||n[0]!==``)&&(r===`.`||r===``)&&(t=!0,n.splice(e,1),e--)}n[0]===`.`&&n.length===2&&(n[1]===`.`||n[1]===``)&&(t=!0,n.pop())}let i=0;for(;(i=n.indexOf(`..`,i+1))!==-1;){let e=n[i-1];if(e&&e!==`.`&&e!==`..`&&e!==`**`){t=!0;let e=i===1&&n[i+1]===`**`?[`.`]:[];n.splice(i-1,2,...e),n.length===0&&n.push(``),i-=2}}}}while(t);return e}secondPhasePreProcess(e){for(let t=0;t<e.length-1;t++)for(let n=t+1;n<e.length;n++){let r=this.partsMatch(e[t],e[n],!this.preserveMultipleSlashes);if(r){e[t]=[],e[n]=r;break}}return e.filter(e=>e.length)}partsMatch(e,t,n=!1){let r=0,i=0,a=[],o=``;for(;r<e.length&&i<t.length;)if(e[r]===t[i])a.push(o===`b`?t[i]:e[r]),r++,i++;else if(n&&e[r]===`**`&&t[i]===e[r+1])a.push(e[r]),r++;else if(n&&t[i]===`**`&&e[r]===t[i+1])a.push(t[i]),i++;else if(e[r]===`*`&&t[i]&&(this.options.dot||!t[i].startsWith(`.`))&&t[i]!==`**`){if(o===`b`)return!1;o=`a`,a.push(e[r]),r++,i++}else if(t[i]===`*`&&e[r]&&(this.options.dot||!e[r].startsWith(`.`))&&e[r]!==`**`){if(o===`a`)return!1;o=`b`,a.push(t[i]),r++,i++}else return!1;return e.length===t.length&&a}parseNegate(){if(this.nonegate)return;let e=this.pattern,t=!1,n=0;for(let r=0;r<e.length&&e.charAt(r)===`!`;r++)t=!t,n++;n&&(this.pattern=e.slice(n)),this.negate=t}matchOne(e,t,n=!1){let r=0,i=0;if(this.isWindows){let n=typeof e[0]==`string`&&/^[a-z]:$/i.test(e[0]),a=!n&&e[0]===``&&e[1]===``&&e[2]===`?`&&/^[a-z]:$/i.test(e[3]),o=typeof t[0]==`string`&&/^[a-z]:$/i.test(t[0]),s=!o&&t[0]===``&&t[1]===``&&t[2]===`?`&&typeof t[3]==`string`&&/^[a-z]:$/i.test(t[3]),c=a?3:n?0:void 0,l=s?3:o?0:void 0;if(typeof c==`number`&&typeof l==`number`){let[n,a]=[e[c],t[l]];n.toLowerCase()===a.toLowerCase()&&(t[l]=n,i=l,r=c)}}let{optimizationLevel:a=1}=this.options;return a>=2&&(e=this.levelTwoFileOptimize(e)),t.includes(sc)?this.#e(e,t,n,r,i):this.#n(e,t,n,r,i)}#e(e,t,n,r,i){let a=t.indexOf(sc,i),o=t.lastIndexOf(sc),[s,c,l]=n?[t.slice(i,a),t.slice(a+1),[]]:[t.slice(i,a),t.slice(a+1,o),t.slice(o+1)];if(s.length){let t=e.slice(r,r+s.length);if(!this.#n(t,s,n,0,0))return!1;r+=s.length,i+=s.length}let u=0;if(l.length){if(l.length+r>e.length)return!1;let t=e.length-l.length;if(this.#n(e,l,n,t,0))u=l.length;else{if(e[e.length-1]!==``||r+l.length===e.length||(t--,!this.#n(e,l,n,t,0)))return!1;u=l.length+1}}if(!c.length){let t=!!u;for(let n=r;n<e.length-u;n++){let r=String(e[n]);if(t=!0,r===`.`||r===`..`||!this.options.dot&&r.startsWith(`.`))return!1}return n||t}let d=[[[],0]],f=d[0],p=0,m=[0];for(let e of c)e===sc?(m.push(p),f=[[],0],d.push(f)):(f[0].push(e),p++);let h=d.length-1,g=e.length-u;for(let e of d)e[1]=g-(m[h--]+e[0].length);return!!this.#t(e,d,r,0,n,0,!!u)}#t(e,t,n,r,i,a,o){let s=t[r];if(!s){for(let t=n;t<e.length;t++){o=!0;let n=e[t];if(n===`.`||n===`..`||!this.options.dot&&n.startsWith(`.`))return!1}return o}let[c,l]=s;for(;n<=l;){if(this.#n(e.slice(0,n+c.length),c,i,n,0)&&a<this.maxGlobstarRecursion){let s=this.#t(e,t,n+c.length,r+1,i,a+1,o);if(s!==!1)return s}let s=e[n];if(s===`.`||s===`..`||!this.options.dot&&s.startsWith(`.`))return!1;n++}return i||null}#n(e,t,n,r,i){let a,o,s,c;for(a=r,o=i,c=e.length,s=t.length;a<c&&o<s;a++,o++){this.debug(`matchOne loop`);let n=t[o],r=e[a];if(this.debug(t,n,r),n===!1||n===sc)return!1;let i;if(typeof n==`string`?(i=r===n,this.debug(`string match`,n,r,i)):(i=n.test(r),this.debug(`pattern match`,n,r,i)),!i)return!1}if(a===c&&o===s)return!0;if(a===c)return n;if(o===s)return a===c-1&&e[a]===``;throw Error(`wtf?`)}braceExpand(){return mc(this.pattern,this.options)}parse(e){as(e);let t=this.options;if(e===`**`)return sc;if(e===``)return``;let n,r=null;(n=e.match(Js))?r=t.dot?Xs:Ys:(n=e.match(Rs))?r=(t.nocase?t.dot?Hs:Vs:t.dot?Bs:zs)(n[1]):(n=e.match(Zs))?r=(t.nocase?t.dot?$s:Qs:t.dot?ec:tc)(n):(n=e.match(Us))?r=t.dot?Gs:Ws:(n=e.match(Ks))&&(r=qs);let i=Ns.fromGlob(e,this.options).toMMPattern();return r&&typeof i==`object`&&Reflect.defineProperty(i,"test",{value:r}),i}makeRe(){if(this.regexp||this.regexp===!1)return this.regexp;let e=this.set;if(!e.length)return this.regexp=!1,this.regexp;let t=this.options,n=t.noglobstar?cc:t.dot?lc:uc,r=new Set(t.nocase?[`i`]:[]),i=e.map(e=>{let t=e.map(e=>{if(e instanceof RegExp)for(let t of e.flags.split(``))r.add(t);return typeof e==`string`?vc(e):e===sc?sc:e._src});t.forEach((e,r)=>{let i=t[r+1],a=t[r-1];e===sc&&a!==sc&&(a===void 0?i!==void 0&&i!==sc?t[r+1]=`(?:\\/|`+n+`\\/)?`+i:t[r]=n:i===void 0?t[r-1]=a+`(?:\\/|\\/`+n+`)?`:i!==sc&&(t[r-1]=a+`(?:\\/|\\/`+n+`\\/)`+i,t[r+1]=sc))});let i=t.filter(e=>e!==sc);if(this.partial&&i.length>=1){let e=[];for(let t=1;t<=i.length;t++)e.push(i.slice(0,t).join(`/`));return`(?:`+e.join(`|`)+`)`}return i.join(`/`)}).join(`|`),[a,o]=e.length>1?[`(?:`,`)`]:[``,``];i=`^`+a+i+o+`$`,this.partial&&(i=`^(?:\\/|`+a+i.slice(1,-1)+o+`)$`),this.negate&&(i=`^(?!`+i+`).+$`);try{this.regexp=new RegExp(i,[...r].join(``))}catch{this.regexp=!1}return this.regexp}slashSplit(e){return this.preserveMultipleSlashes?e.split(`/`):this.isWindows&&/^\/\/[^/]+/.test(e)?[``,...e.split(/\/+/)]:e.split(/\/+/)}match(e,t=this.partial){if(this.debug(`match`,e,this.pattern),this.comment)return!1;if(this.empty)return e===``;if(e===`/`&&t)return!0;let n=this.options;this.isWindows&&(e=e.split(`\\`).join(`/`));let r=this.slashSplit(e);this.debug(this.pattern,`split`,r);let i=this.set;this.debug(this.pattern,`set`,i);let a=r[r.length-1];if(!a)for(let e=r.length-2;!a&&e>=0;e--)a=r[e];for(let e of i){let i=r;if(n.matchBase&&e.length===1&&(i=[a]),this.matchOne(i,e,t))return n.flipNegate?!0:!this.negate}return!n.flipNegate&&this.negate}static defaults(e){return Ls.defaults(e).Minimatch}},Ls.AST=Ns,Ls.Minimatch=yc,Ls.escape=Fs,Ls.unescape=ps})))()}function xc(e){let t=(0,Rc.c)(111),{gitRoot:r,gitCommonDir:i,cwd:a,hostId:o,paths:s}=e,c;t[0]!==a||t[1]!==r?(c=Nc(r,a),t[0]=a,t[1]=r,t[2]=c):c=t[2];let{normalizedGitRoot:l,normalizedCwd:u,cwdRelativeToGitRoot:d}=c,f=l==null?null:`${l}/.gitattributes`,p=d!=null&&d!==``?`${u}/.gitattributes`:null,m;t[3]!==l||t[4]!==s?(m=wc(l,s),t[3]=l,t[4]=s,t[5]=m):m=t[5];let h=m,_;t[6]===i?_=t[7]:(_=i==null?null:`${g(i)}/info/attributes`,t[6]=i,t[7]=_);let v=_,y;t[8]!==p||t[9]!==v||t[10]!==f||t[11]!==h?(y=[f,p,v,...h].filter(Cc),t[8]=p,t[9]=v,t[10]=f,t[11]=h,t[12]=y):y=t[12];let b=y,x;t[13]===b?x=t[14]:(x=Array.from(new Set(b)),t[13]=b,t[14]=x);let S=jc(x,o),C;t[15]!==S.paths||t[16]!==f?(C=f!=null&&S.paths.has(f),t[15]=S.paths,t[16]=f,t[17]=C):C=t[17];let w=C,T;t[18]!==p||t[19]!==S.paths?(T=p!=null&&S.paths.has(p),t[18]=p,t[19]=S.paths,t[20]=T):T=t[20];let E=T,D;t[21]===S.paths?D=t[22]:(D=Array.from(S.paths),t[21]=S.paths,t[22]=D);let O;t[23]!==p||t[24]!==f||t[25]!==D?(O=D.filter(e=>e!==f&&e!==p),t[23]=p,t[24]=f,t[25]=D,t[26]=O):O=t[26];let k=O,A;t[27]!==k||t[28]!==o?(A={queries:k.map(e=>({queryKey:ne(`read-file`,{hostId:o,path:e}),queryFn:t=>{let{signal:n}=t;return se(`read-file`,{params:{hostId:o,path:e},signal:n})},staleTime:n.FIVE_SECONDS}))},t[27]=k,t[28]=o,t[29]=A):A=t[29];let j=P(A),M;bb0:{if(d==null||d===``){let e;t[30]===Symbol.for(`react.memo_cache_sentinel`)?(e=[],t[30]=e):e=t[30],M=e;break bb0}let e;if(t[31]!==d||t[32]!==s){let n;t[34]===d?n=t[35]:(n=e=>{let t=g(e);return t.includes(`/`)&&Ec(t,d)==null},t[34]=d,t[35]=n),e=s.filter(n),t[31]=d,t[32]=s,t[33]=e}else e=t[33];M=e}let N=M,F;t[36]!==N||t[37]!==u||t[38]!==l?(F=Ic({ambiguousSlashPaths:N,normalizedCwd:u,normalizedGitRoot:l}),t[36]=N,t[37]=u,t[38]=l,t[39]=F):F=t[39];let ee=jc(F,o),te=f??``,re;t[40]!==o||t[41]!==te?(re={hostId:o,path:te},t[40]=o,t[41]=te,t[42]=re):re=t[42];let ie;t[43]===w?ie=t[44]:(ie={enabled:w},t[43]=w,t[44]=ie);let ae;t[45]!==re||t[46]!==ie?(ae={params:re,queryConfig:ie},t[45]=re,t[46]=ie,t[47]=ae):ae=t[47];let{data:oe,isLoading:I}=Se(`read-file`,ae),ce=p??``,L;t[48]!==o||t[49]!==ce?(L={hostId:o,path:ce},t[48]=o,t[49]=ce,t[50]=L):L=t[50];let le;t[51]===E?le=t[52]:(le={enabled:E},t[51]=E,t[52]=le);let R;t[53]!==L||t[54]!==le?(R={params:L,queryConfig:le},t[53]=L,t[54]=le,t[55]=R):R=t[55];let{data:z,isLoading:ue}=Se(`read-file`,R);oe?.contents;let de=oe?.contents??null,fe;t[56]===de?fe=t[57]:(fe=Tc(de),t[56]=de,t[57]=fe);let pe=fe,me;t[58]!==z?.contents||t[59]!==d?(me=()=>d==null||d===``?null:Tc(z?.contents??null,{basePath:d}),t[58]=z?.contents,t[59]=d,t[60]=me):me=t[60],z?.contents;let he;t[61]===me?he=t[62]:(he=me(),t[61]=me,t[62]=he);let ge=he;z?.contents;let _e;bb1:{if(d==null||d===``){_e=null;break bb1}let e=z?.contents??null,n;t[63]===e?n=t[64]:(n=Tc(e),t[63]=e,t[64]=n),_e=n}let ve=_e,ye;if(t[65]!==k||t[66]!==j||t[67]!==p||t[68]!==v||t[69]!==f||t[70]!==ge||t[71]!==pe||t[72]!==l){let e;t[74]===v?e=t[75]:(e=(e,t)=>e.attributesPath===v?-1:t.attributesPath===v?1:t.attributesPath.length-e.attributesPath.length,t[74]=v,t[75]=e),ye=[...f!=null&&pe!=null?[{attributesPath:f,matcher:pe}]:[],...p!=null&&ge!=null?[{attributesPath:p,matcher:ge}]:[],...k.flatMap((e,t)=>{let n=j[t]?.data?.contents,r=e===v?null:Ec(e.slice(0,-15),l),i=Tc(n??null,{basePath:r});return i==null?[]:[{attributesPath:e,matcher:i}]})].sort(e),t[65]=k,t[66]=j,t[67]=p,t[68]=v,t[69]=f,t[70]=ge,t[71]=pe,t[72]=l,t[73]=ye}else ye=t[73];let be=ye,B;t[76]!==N||t[77]!==ee.paths||t[78]!==u||t[79]!==l?(B=Lc({ambiguousSlashPaths:N,normalizedCwd:u,normalizedGitRoot:l,existingCandidatePaths:ee.paths}),t[76]=N,t[77]=ee.paths,t[78]=u,t[79]=l,t[80]=B):B=t[80];let xe=B,Ce;t[81]!==p||t[82]!==xe||t[83]!==d||t[84]!==ve||t[85]!==be?(Ce=e=>{let t=g(e);for(let{attributesPath:e,matcher:n}of be){let r=n(t);if(r!=null)return r===`set`;if(e===p&&Dc(t,d,xe)){let e=ve?.(t)??null;if(e!=null)return e===`set`}}return!1},t[81]=p,t[82]=xe,t[83]=d,t[84]=ve,t[85]=be,t[86]=Ce):Ce=t[86];let we=Ce,Te;bb2:{if(be.length===0){let e;t[87]===Symbol.for(`react.memo_cache_sentinel`)?(e=new Set,t[87]=e):e=t[87],Te=e;break bb2}let e;if(t[88]!==we||t[89]!==s){let n;t[91]===we?n=t[92]:(n=e=>we(e),t[91]=we,t[92]=n),e=new Set(s.filter(n)),t[88]=we,t[89]=s,t[90]=e}else e=t[90];Te=e}let Ee=Te,De;if(t[93]!==v||t[94]!==be){let e;t[96]===v?e=t[97]:(e=e=>{let{attributesPath:t}=e;return t!==v},t[96]=v,t[97]=e),De=be.some(e),t[93]=v,t[94]=be,t[95]=De}else De=t[95];let Oe=k.length>0,ke;t[98]!==j||t[99]!==E||t[100]!==ue||t[101]!==ee.isLoading||t[102]!==S.isLoading||t[103]!==w||t[104]!==I?(ke=!S.isLoading&&!ee.isLoading&&(!w||!I)&&(!E||!ue)&&j.every(Sc),t[98]=j,t[99]=E,t[100]=ue,t[101]=ee.isLoading,t[102]=S.isLoading,t[103]=w,t[104]=I,t[105]=ke):ke=t[105];let Ae;return t[106]!==Ee||t[107]!==De||t[108]!==Oe||t[109]!==ke?(Ae={hasLinguistGeneratedAttributes:De,hasUnhandledAttributesFiles:Oe,isReady:ke,paths:Ee},t[106]=Ee,t[107]=De,t[108]=Oe,t[109]=ke,t[110]=Ae):Ae=t[110],Ae}function Sc(e){return!e.isLoading}function Cc(e){return e!=null&&e.length>0}function wc(e,t){if(e==null)return[];let n=new Set;for(let r of t){let t=g(r).split(`/`).filter(Boolean);for(let r=0;r<t.length-1;r+=1)n.add(s(e,`${t.slice(0,r+1).join(`/`)}/.gitattributes`))}return Array.from(n)}function Tc(e,t={}){if(!e)return null;let n=t.basePath==null?null:g(t.basePath).replace(/^\/+/,``).replace(/\/+$/,``),r=e.split(/\r?\n/).map(e=>Oc(e)).filter(e=>e!=null);return r.length===0?null:e=>{let t=null,i=Ec(g(e),n);if(i==null)return null;for(let e of r)e.matches(i)&&(t=e.state);return t}}function Ec(e,t){if(t==null)return e;let n=`${t}/`;return e===t?``:e.startsWith(n)?e.slice(n.length):null}function Dc(e,t,n){return t==null||t===``?!1:e.includes(`/`)?n.has(e):Ec(e,t)==null}function Oc(e){let t=e.trim();if(t.length===0||t.startsWith(`#`)||t.startsWith(`[attr]`))return null;let n=t.split(/\s+/);if(n.length<2)return null;let r=Ac(n[0]);if(!r)return null;let i=kc(n.slice(1));return i==null?null:{matches:r,state:i}}function kc(e){let t=null;for(let n of e){if(n===`linguist-generated`||n===`linguist-generated=true`){t=`set`;continue}if(n===`-linguist-generated`||n===`linguist-generated=false`){t=`unset`;continue}n===`!linguist-generated`&&(t=`unspecified`)}return t}function Ac(e){if(!e)return null;let t=new yc(e.replace(/^\/+/,``),{dot:!0,matchBase:!e.includes(`/`),nobrace:!0,noext:!0,nonegate:!0,nocomment:!0,platform:`linux`});return e=>t.match(g(e))}function jc(e,t){let n=(0,Rc.c)(13),r;n[0]!==t||n[1]!==e?(r={hostId:t,paths:e},n[0]=t,n[1]=e,n[2]=r):r=n[2];let i=e.length>0,a;n[3]===i?a=n[4]:(a={enabled:i},n[3]=i,n[4]=a);let o;n[5]!==r||n[6]!==a?(o={params:r,queryConfig:a},n[5]=r,n[6]=a,n[7]=o):o=n[7];let{data:s,isLoading:c}=Se(`paths-exist`,o);s?.existingPaths;let l;n[8]===s?.existingPaths?l=n[9]:(l=new Set(s?.existingPaths.map(Mc)??[]),n[8]=s?.existingPaths,n[9]=l);let u=l,d;return n[10]!==u||n[11]!==c?(d={isLoading:c,paths:u},n[10]=u,n[11]=c,n[12]=d):d=n[12],d}function Mc(e){return g(e)}function Nc(e,t){let n=Pc(e),r=Pc(t);return{normalizedGitRoot:n,normalizedCwd:r,cwdRelativeToGitRoot:Fc(n,r)}}function Pc(e){return e==null?null:g(e).replace(/\/+$/,``)}function Fc(e,t){if(e==null||t==null)return null;if(t===e)return``;let n=`${e}/`;return t.startsWith(n)?t.slice(n.length):null}function Ic({ambiguousSlashPaths:e,normalizedCwd:t,normalizedGitRoot:n}){return n==null||t==null?[]:e.flatMap(e=>{let r=g(e);return[s(n,r),s(t,r)]})}function Lc({ambiguousSlashPaths:e,normalizedCwd:t,normalizedGitRoot:n,existingCandidatePaths:r}){return n==null||t==null?new Set:new Set(e.filter(e=>{let i=g(e),a=g(s(n,i)),o=g(s(t,i));return r.has(o)&&!r.has(a)}))}var Rc;function zc(){return(zc=e((()=>{Rc=t(),M(),bc(),m(),D(),ve()})))()}var Bc;function Vc(){return(Vc=e((()=>{Bc=`<svg
  width="21"
  height="21"
  viewBox="0 0 21 21"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M17.2379 7.69907C17.2379 6.95248 17.237 6.43448 17.2041 6.03179C17.1799 5.73568 17.1402 5.53676 17.0862 5.38579L17.0277 5.24941C16.866 4.93211 16.6201 4.66653 16.3181 4.4814L16.1859 4.40757C16.02 4.32306 15.7978 4.26345 15.4035 4.2312C15.0009 4.19831 14.4826 4.19736 13.7362 4.19736H7.26086C6.51427 4.19736 5.99627 4.1983 5.59357 4.2312C5.29763 4.25539 5.09852 4.29409 4.94758 4.3481L4.8112 4.40757C4.49383 4.56929 4.22831 4.81512 4.04318 5.11714L3.96936 5.24941C3.88482 5.41532 3.82523 5.6373 3.79299 6.03179C3.76009 6.43448 3.75915 6.95248 3.75915 7.69907V12.8732C3.75915 13.548 3.76318 13.7789 3.80017 13.956L3.834 14.0944C4.03021 14.777 4.58934 15.3012 5.29211 15.448L5.44079 15.4695C5.61188 15.4861 5.86792 15.4879 6.3739 15.4879C6.58107 15.4879 6.7238 15.4877 6.86506 15.4992L7.05373 15.5197C7.49382 15.5811 7.91814 15.7309 8.30061 15.9596L8.48518 16.0796C8.55028 16.1245 8.62134 16.1752 8.70564 16.2355L10.0909 17.225L10.3996 17.4382C10.4603 17.4756 10.4695 17.4737 10.455 17.47L10.498 17.4751C10.5127 17.4752 10.5278 17.4737 10.5421 17.47L10.5965 17.4382C10.6645 17.3964 10.7522 17.3349 10.9061 17.225L12.2914 16.2355L12.5109 16.0796C12.576 16.0346 12.6356 15.996 12.6965 15.9596L12.8626 15.8663C13.2563 15.6605 13.6879 15.5354 14.132 15.4992L14.3525 15.49C14.4315 15.4887 14.5187 15.4879 14.6221 15.4879C15.2969 15.4879 15.5279 15.4849 15.705 15.448L15.8434 15.4131C16.5259 15.217 17.05 14.6586 17.1969 13.956L17.2184 13.8063C17.2351 13.6352 17.2379 13.379 17.2379 12.8732V7.69907ZM10.6785 10.6758C11.0641 10.6758 11.3768 10.9884 11.3768 11.3741C11.3768 11.7597 11.0641 12.0724 10.6785 12.0724H7.69665C7.31102 12.0724 6.99836 11.7597 6.99836 11.3741C6.99836 10.9884 7.31102 10.6758 7.69665 10.6758H10.6785ZM13.3035 7.17612L13.444 7.19048C13.7623 7.2555 14.0018 7.5369 14.0018 7.87442C14.0016 8.21182 13.7622 8.49341 13.444 8.55835L13.3035 8.57271H7.69665C7.31113 8.57271 6.99854 8.25989 6.99836 7.87442C6.99836 7.48878 7.31102 7.17612 7.69665 7.17612H13.3035ZM18.6345 12.8732C18.6345 13.3267 18.6359 13.6704 18.6058 13.9632L18.5637 14.2411C18.3105 15.4535 17.4066 16.4171 16.2289 16.7553L15.99 16.8148C15.6362 16.8886 15.2264 16.8845 14.6221 16.8845L14.2458 16.8917C14.0252 16.9097 13.8098 16.9651 13.6091 17.0558L13.4132 17.1583L13.1025 17.3716L11.7182 18.3611C11.504 18.5141 11.2697 18.6916 11.0015 18.7876L10.8846 18.8235C10.6945 18.8717 10.4977 18.8845 10.3042 18.8605L10.1125 18.8235C9.87394 18.7631 9.66181 18.6313 9.4675 18.4954L9.27883 18.3611L7.89353 17.3716L7.58386 17.1583C7.39381 17.0447 7.18578 16.9643 6.96965 16.9214L6.75124 16.8917C6.67965 16.8859 6.60316 16.8845 6.3739 16.8845C5.92038 16.8845 5.57673 16.887 5.28391 16.8568L5.00603 16.8148C3.79382 16.5615 2.82999 15.6574 2.49177 14.48L2.43332 14.2411C2.3594 13.8871 2.36257 13.4777 2.36257 12.8732V7.69907C2.36257 6.97553 2.36188 6.39072 2.40051 5.91797C2.43979 5.43729 2.52314 5.01117 2.72453 4.61572L2.85271 4.38604C3.172 3.86554 3.63042 3.4415 4.17751 3.16274L4.32722 3.09302C4.68032 2.94157 5.05908 2.8731 5.47976 2.83872C5.95251 2.8001 6.53731 2.80078 7.26086 2.80078H13.7362C14.4596 2.80078 15.0446 2.8001 15.5173 2.83872C15.998 2.87802 16.4241 2.9613 16.8196 3.16274L17.0482 3.29092C17.5689 3.61023 17.9927 4.06846 18.2715 4.61572L18.3423 4.76543C18.4937 5.11849 18.5612 5.49736 18.5955 5.91797C18.6342 6.39072 18.6345 6.97553 18.6345 7.69907V12.8732Z"
    fill="currentColor"
  />
</svg>
`})))()}function Hc(e){let t=(0,el.c)(50),{activePath:n,allowSelectingActivePath:r,cwd:i,hostId:a,onSelectPath:o,commentCountByPath:s,entries:c,reserveBottomPadding:l}=e,u=r!==void 0&&r,d=l!==void 0&&l,f;t[0]===i?f=t[1]:(f=i==null?null:k(i),t[0]=i,t[1]=f);let p=f,m;t[2]===c?m=t[3]:(m=xe(c),t[2]=c,t[3]=m);let h=m,g;t[4]===h?g=t[5]:(g=h.map(qc),t[4]=h,t[5]=g);let _=g,v;t[6]===h?v=t[7]:(v=h.map(Kc),t[6]=h,t[7]=v);let b=v,x;t[8]===b?x=t[9]:(x=b.map(Gc).join(`\0`),t[8]=b,t[9]=x);let S=x,C;t[10]===h?C=t[11]:(C=new Map(h.map(Wc)),t[10]=h,t[11]=C);let T=C,E;t[12]===_?E=t[13]:(E=Yc(_),t[12]=_,t[13]=E);let D=E,O;t[14]===h?O=t[15]:(O=h.map(Uc),t[14]=h,t[15]=O);let A=O,j;bb0:{if(s==null){j=void 0;break bb0}let e;t[16]===s?e=t[17]:(e=Qc(s.values()),t[16]=s,t[17]=e),j=e}let M=j,N;t[18]!==s||t[19]!==T?(N=e=>{let{item:t}=e;if(t.kind!==`file`)return null;let n=T.get(t.path),r=n==null?0:s?.get(n.path)??0;return r===0?null:{icon:Zc(r)}},t[18]=s,t[19]=T,t[20]=N):N=t[20];let P=w(N),F;t[21]!==n||t[22]!==h?(F=n==null?void 0:h.find(e=>e.entry.path===n)?.treePath,t[21]=n,t[22]=h,t[23]=F):F=t[23];let te=F,ne;t[24]!==n||t[25]!==T||t[26]!==o?(ne=e=>{let t=e.find(e=>T.get(e)!=null);if(t==null)return;let r=T.get(t)?.path;r!=null&&r!==n&&o(r)},t[24]=n,t[25]=T,t[26]=o,t[27]=ne):ne=t[27];let re=w(ne),ie;t[28]!==u||t[29]!==T||t[30]!==o?(ie=e=>{if(!u)return;let t=Ua(e.nativeEvent);if(t==null)return;let n=T.get(t)?.path;n!=null&&o(n)},t[28]=u,t[29]=T,t[30]=o,t[31]=ie):ie=t[31];let ae=ie,oe;t[32]===d?oe=t[33]:(oe=d?{paddingTop:R,paddingBottom:Ce}:void 0,t[32]=d,t[33]=oe);let I;t[34]!==te||t[35]!==M||t[36]!==D||t[37]!==b||t[38]!==S||t[39]!==h.length||t[40]!==p||t[41]!==A||t[42]!==ae||t[43]!==re||t[44]!==a||t[45]!==P?(I=h.length>0?(0,tl.jsx)(he,{name:`ReviewFileTree`,resetKey:S,fallback:(0,tl.jsx)(ee,{align:`start`,className:`px-2 py-2`,children:(0,tl.jsx)(y,{id:`codex.review.fileTree.renderError`,defaultMessage:`File tree couldn't render`,description:`Error shown when the review file tree fails to render`})}),children:(0,tl.jsx)(Za,{flattenEmptyDirectories:!0,cwd:p,decorationIcons:M,gitStatus:A,hostId:a,initialExpandedPaths:D,itemHeight:nl,onClick:ae,onSelectionChange:re,paths:b,renderRowDecoration:P,selectedPath:te,unsafeCSS:`
              [data-item-type='file'] {
                color: var(--color-text-tertiary);
              }

              [data-item-type='file']:hover,
              [data-item-type='file'][aria-selected='true'] {
                color: var(--color-text);
              }
            `})}):(0,tl.jsx)(Jc,{}),t[34]=te,t[35]=M,t[36]=D,t[37]=b,t[38]=S,t[39]=h.length,t[40]=p,t[41]=A,t[42]=ae,t[43]=re,t[44]=a,t[45]=P,t[46]=I):I=t[46];let se;return t[47]!==oe||t[48]!==I?(se=(0,tl.jsx)(`div`,{className:`h-full min-h-0 w-full px-2`,style:oe,children:I}),t[47]=oe,t[48]=I,t[49]=se):se=t[49],se}function Uc(e){let{entry:t,treePath:n}=e;return{path:n,status:Xc(t.changeKind)}}function Wc(e){let{entry:t,treePath:n}=e;return[n,t]}function Gc(e){let{displayPath:t,path:n}=e;return`${t}\0${n}`}function Kc(e){let{entry:t,treePath:n}=e;return{displayPath:n,path:t.path}}function qc(e){return e.treePath}function Jc(){let e=(0,el.c)(1),t;return e[0]===Symbol.for(`react.memo_cache_sentinel`)?(t=(0,tl.jsx)(ee,{align:`start`,className:`px-2 py-2`,children:(0,tl.jsx)(y,{id:`codex.review.fileSearch.empty`,defaultMessage:`No matching files`,description:`Empty state shown when the file filter hides all files in review`})}),e[0]=t):t=e[0],t}function Yc(e){let t=new Set;for(let n of e){let e=n.endsWith(`/`)?n.slice(0,-1):n,r=e.indexOf(`/`);for(;r!==-1;)t.add(e.slice(0,r)),r=e.indexOf(`/`,r+1)}return Array.from(t)}function Xc(e){switch(e){case`added`:case`deleted`:case`modified`:case`renamed`:case`untracked`:return e;case`copied`:return`added`;case`type-changed`:case`unmerged`:return`modified`}}function Zc(e){let t=$c(e);return{height:il,name:`review-file-tree-comment-${e}`,viewBox:`0 0 ${t} ${il}`,width:t}}function Qc(e){return Array.from(new Set(e)).filter(e=>e>0).map(e=>{let t=il/2;return{...Zc(e),body:`<g transform="scale(${ol})">${rl}</g><text x="22" y="${t}" fill="currentColor" font-size="12" font-family="system-ui" dominant-baseline="middle">${e}</text>`}})}function $c(e){return 22+String(e).length*al}var el,tl,nl,rl,il,al,ol;function sl(){return(sl=e((()=>{el=t(),N(),l(),I(),de(),So(),oe(),Vc(),ue(),O(),tl=c(),nl=29,rl=Bc.replace(/<svg[^>]*>/,``).replace(`</svg>`,``),il=18,al=7,ol=il/21})))()}export{zc as a,Eo as c,Ua as d,Wa as f,Tc as i,Za as l,Hc as n,xc as o,sl as r,Co as s,Jc as t,So as u};
//# sourceMappingURL=review-file-tree-pane-9f14b1aefd4b.js.map