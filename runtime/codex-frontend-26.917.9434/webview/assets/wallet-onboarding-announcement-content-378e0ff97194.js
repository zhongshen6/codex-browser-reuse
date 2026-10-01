const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./wallet-onboarding-announcement-modal-28bb7ad132a0.js","./rolldown-runtime-2d059c5e81f4.js","./app-shared-dc8f183e4945.js","./app-shared-fa570b9eb9dd.css","./app-initial-fc9a33fdda88.js","./app-initial-e8ceb32eb626.css","./wallet-onboarding-announcement-modal-8f48697b05eb.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-2d059c5e81f4.js";import{$3 as t,AZ as n,Ah as r,BX as i,C_ as a,E4 as o,FX as s,G2 as c,H3 as l,H4 as u,HX as d,I3 as f,Ih as p,Jm as m,K2 as h,KH as g,LX as _,Ph as v,Q3 as y,QI as b,R4 as x,Rh as S,S_ as C,V3 as ee,V4 as te,Y2 as w,YH as T,Yh as ne,Z3 as E,ZI as re,Zh as D,a$ as O,e6 as ie,g4 as k,jZ as ae,n4 as oe,o$ as A,q4 as j,qH as se,qm as ce,vD as M,wL as le,x4 as ue,yD as N,zh as P}from"./app-shared-dc8f183e4945.js";import{$H as F,Blt as de,Fnt as I,Jdt as L,KU as fe,Llt as R,Nnt as pe,Ok as z,Pnt as B,QH as me,Rdt as he,Rlt as ge,Slt as V,Ydt as _e,cXt as ve,eU as ye,kk as H,lXt as be,mXt as xe,pXt as Se,qU as Ce,sXt as we,xlt as Te,zdt as Ee}from"./app-initial-fc9a33fdda88.js";function De(e,{styleVariables:t={},theme:n=`light`}={}){return`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      html, body { min-height: 100%; margin: 0; background: var(--color-background-primary, #fff); }
      body { color: var(--color-text-primary, #171717); font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); }
      * { box-sizing: border-box; }
      form { display: flex; flex-direction: column; width: 100%; min-height: 100vh; padding: 28px 24px 8px; }
      .enrollment-content { display: flex; flex: 1; flex-direction: column; justify-content: center; }
      h1 { margin: 0 0 28px; color: var(--color-text-primary, #171717); font-size: 20px; font-weight: var(--font-weight-semibold, 600); line-height: 25px; letter-spacing: -0.45px; text-align: center; }
      .fields { overflow: hidden; border: 1px solid var(--color-border-primary, #d8d8d8); border-radius: 13px; background: var(--color-background-secondary, #fff); }
      label { display: grid; min-width: 0; padding: 7px 16px 6px; color: var(--color-text-primary, #171717); font-size: 13px; line-height: 17px; }
      label:focus-within { outline: none; box-shadow: inset 0 0 0 2px var(--color-ring-primary, #6b6b6b); }
      .row { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--color-border-secondary, #d8d8d8); }
      .row label + label { border-left: 1px solid var(--color-border-secondary, #d8d8d8); }
      .field { position: relative; height: 24px; overflow: hidden; }
      .hosted { position: absolute; inset: 0; opacity: 0; }
      .field::before { position: absolute; top: 7px; left: 0; width: 42%; height: 10px; border-radius: 999px; background: var(--color-background-disabled, #dedede); content: ""; opacity: 0.8; }
      [data-fields-ready="true"] .hosted { opacity: 1; }
      [data-fields-ready="true"] .field::before { content: none; }
      .privacy { margin: 24px 0 0; color: var(--color-text-tertiary, #8f8f8f); font-size: 12px; line-height: 16px; text-align: center; }
      .verification select, .verification input { width: 100%; height: 32px; border: 0; background: transparent; color: inherit; font: inherit; font-size: 16px; }
      .actions { display: flex; flex-shrink: 0; flex-direction: column; }
      .status { min-height: 16px; margin: 16px 0 0; color: var(--color-text-secondary, #666); font-size: 14px; line-height: 16px; text-align: center; }
      .error { display: none; margin-top: 16px; padding: 12px; border: 1px solid var(--color-border-danger, #efc4c4); border-radius: 12px; background: var(--color-background-danger, #fff5f5); color: var(--color-text-danger, #a12020); font-size: 14px; line-height: 20px; text-align: center; }
      .error[data-visible="true"] { display: block; }
      button { width: 100%; min-height: 44px; margin-top: 16px; border: 0; border-radius: 999px; background: var(--color-background-inverse, #171717); color: var(--color-text-inverse, #fff); font: inherit; font-size: 15px; font-weight: var(--font-weight-medium, 500); cursor: var(--cursor-interaction); }
      button:disabled { background: var(--color-background-disabled, #dedede); color: var(--color-text-disabled, #8a8a8a); cursor: not-allowed; }
      .retry { display: none; }
      .retry[data-visible="true"] { display: block; }
      [hidden] { display: none !important; }
      html[data-theme="dark"], html[data-theme="dark"] body { background: var(--color-background-primary, #171717); }
      html[data-theme="dark"] body, html[data-theme="dark"] h1, html[data-theme="dark"] label { color: var(--color-text-primary, #f5f5f5); }
      html[data-theme="dark"] .fields { border-color: var(--color-border-primary, #555); background: var(--color-background-secondary, #242424); }
      html[data-theme="dark"] .row, html[data-theme="dark"] .row label + label { border-color: var(--color-border-secondary, #555); }
      html[data-theme="dark"] .privacy { color: var(--color-text-tertiary, #a3a3a3); }
      html[data-theme="dark"] .status { color: var(--color-text-secondary, #c7c7c7); }
      html[data-theme="dark"] label:focus-within { box-shadow: inset 0 0 0 2px var(--color-ring-primary, #b8b8b8); }
      html[data-theme="dark"] button { background: var(--color-background-inverse, #f5f5f5); color: var(--color-text-inverse, #171717); }
      html[data-theme="dark"] button:disabled { background: var(--color-background-disabled, #484848); color: var(--color-text-disabled, #999); }
      html[data-theme="dark"] .error { border-color: var(--color-border-danger, #744343); background: var(--color-background-danger, #342424); color: var(--color-text-danger, #f3b6b6); }
      @media (max-width: 420px) { form { padding: 22px 18px 8px; } label { padding-right: 14px; padding-left: 14px; } }
    </style>
  </head>
  <body>
    <form id="form" data-fields-ready="false">
      <div class="enrollment-content">
        <h1 id="title"></h1>
        <div class="fields" id="fields" aria-busy="true">
          <label><span id="card-number-label"></span><span class="field"><span class="hosted" id="vgs-card-number"></span></span></label>
          <div class="row">
            <label><span id="expiration-label"></span><span class="field"><span class="hosted" id="vgs-card-expiration"></span></span></label>
            <label><span id="cvc-label"></span><span class="field"><span class="hosted" id="vgs-card-cvc"></span></span></label>
          </div>
        </div>
        <p class="privacy" id="privacy"></p>
        <div class="verification" id="verification" hidden>
          <div class="fields">
            <label><span id="verification-option-label"></span><select id="verification-option"></select></label>
          </div>
          <button id="request-code" type="button"></button>
          <div id="code-fields" hidden>
            <div class="fields">
              <label><span id="verification-code-label"></span><input id="verification-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" /></label>
            </div>
            <button id="verify-code" type="button"></button>
          </div>
        </div>
      </div>
      <div class="actions">
        <p class="status" id="status" role="status"></p>
        <div class="error" id="error" role="alert"></div>
        <button id="submit" type="submit" disabled></button>
        <button class="retry" id="retry" type="button"></button>
      </div>
    </form>
    <script>
      (() => {
        const messages = ${JSON.stringify(e).replaceAll(`<`,`\\u003c`)};
        const initialStyleVariables = ${JSON.stringify(t).replaceAll(`<`,`\\u003c`)};
        const initialTheme = ${JSON.stringify(n)};
        const sdkUrl = ${JSON.stringify(Y)};
        const fieldInitializationTimeoutMs = ${JSON.stringify(ke)};
        const retryTool = ${JSON.stringify(U)};
        const registerTool = ${JSON.stringify(W)};
        const requestCodeTool = ${JSON.stringify(G)};
        const verifyTool = ${JSON.stringify(K)};
        const finalizeTool = ${JSON.stringify(q)};
        const stageTool = ${JSON.stringify(J)};
        const formRoot = document.getElementById("form");
        const fieldsRoot = document.getElementById("fields");
        const status = document.getElementById("status");
        const error = document.getElementById("error");
        const submit = document.getElementById("submit");
        const retry = document.getElementById("retry");
        const verification = document.getElementById("verification");
        const verificationOption = document.getElementById("verification-option");
        const requestCodeButton = document.getElementById("request-code");
        const codeFields = document.getElementById("code-fields");
        const verificationCode = document.getElementById("verification-code");
        const verifyCodeButton = document.getElementById("verify-code");
        let sdkPromise = null;
        let sdkError = false;
        let activeAttempt = null;
        let form = null;
        let fields = [];
        let fieldValidity = [false, false, false];
        let vaultedCardId = null;
        let registrationReadyToFinalize = false;

        document.getElementById("verification-option-label").textContent = messages.verificationOption;
        document.getElementById("verification-code-label").textContent = messages.verificationCode;
        requestCodeButton.textContent = messages.sendCode;
        verifyCodeButton.textContent = messages.verifyCode;

        const applyHostStyles = () => {
          const root = document.documentElement;
          const theme = globalThis.openai?.theme === "dark" || globalThis.openai?.theme === "light"
            ? globalThis.openai.theme
            : initialTheme;
          root.dataset.theme = theme;
          root.style.colorScheme = theme;
          const styleVariables = globalThis.openai?.toolInput?.style_variables ?? initialStyleVariables;
          for (const [name, value] of Object.entries(styleVariables)) {
            if (typeof value === "string") root.style.setProperty(name, value);
          }
        };

        applyHostStyles();

        document.getElementById("title").textContent = messages.title;
        document.getElementById("card-number-label").textContent = messages.cardNumber;
        document.getElementById("expiration-label").textContent = messages.expiration;
        document.getElementById("cvc-label").textContent = messages.cvc;
        document.getElementById("privacy").textContent = messages.privacy;
        submit.textContent = messages.submit;

        const reportStage = (stage, startedAt, result) => {
          const api = globalThis.openai;
          if (!api || typeof api.callTool !== "function") return;
          void api.callTool(stageTool, {
            duration_ms: Math.max(0, Math.round(performance.now() - startedAt)),
            result,
            stage,
          }).catch(() => undefined);
        };

        const showError = (message, retryLabel) => {
          fieldsRoot.setAttribute("aria-busy", "false");
          status.textContent = "";
          error.textContent = message;
          error.dataset.visible = "true";
          submit.hidden = true;
          retry.textContent = retryLabel;
          retry.dataset.visible = "true";
        };

        const showLoading = () => {
          formRoot.hidden = false;
          formRoot.dataset.fieldsReady = "false";
          fieldsRoot.setAttribute("aria-busy", "true");
          status.textContent = messages.initializing;
          error.textContent = "";
          error.dataset.visible = "false";
          submit.hidden = false;
          submit.disabled = true;
          submit.textContent = messages.submit;
          retry.dataset.visible = "false";
        };

        const resetForm = () => {
          form = null;
          fields = [];
          fieldValidity = [false, false, false];
          vaultedCardId = null;
          registrationReadyToFinalize = false;
          verification.hidden = true;
          fieldsRoot.hidden = false;
          document.getElementById("privacy").hidden = false;
          codeFields.hidden = true;
          verificationCode.value = "";
          for (const id of ["vgs-card-number", "vgs-card-expiration", "vgs-card-cvc"]) {
            document.getElementById(id).replaceChildren();
          }
          showLoading();
        };

        const getStyle = (name, fallback) => {
          const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
          return value || fallback;
        };

        const getFieldBackground = () => {
          const background = getComputedStyle(fieldsRoot).backgroundColor;
          if (background.startsWith("rgb(")) return background;

          const canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = 1;
          const context = canvas.getContext("2d");
          if (!context) return background;

          for (const element of [document.documentElement, document.body, fieldsRoot]) {
            context.fillStyle = getComputedStyle(element).backgroundColor;
            context.fillRect(0, 0, 1, 1);
          }
          const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
          return "rgb(" + red + ", " + green + ", " + blue + ")";
        };

        const getFieldCss = () => {
          const isDark = document.documentElement.dataset.theme === "dark";
          return {
            "&::placeholder": { color: getStyle("--color-text-tertiary", isDark ? "#a3a3a3" : "#8b8b8b") },
            "background-color": getFieldBackground(),
            border: "0",
            "box-sizing": "border-box",
            color: getStyle("--color-text-primary", isDark ? "#f5f5f5" : "#171717"),
            "font-family": getStyle("--font-sans", "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"),
            "font-size": "16px",
            height: "24px",
            "line-height": "24px",
            padding: "0",
            width: "100%",
          };
        };

        const loadSdk = () => {
          if (globalThis.VGSCollect && typeof globalThis.VGSCollect.create === "function") {
            return Promise.resolve(globalThis.VGSCollect);
          }
          if (sdkPromise) return sdkPromise;
          const startedAt = performance.now();
          sdkPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.async = true;
            script.src = sdkUrl;
            script.onload = () => {
              if (globalThis.VGSCollect && typeof globalThis.VGSCollect.create === "function") {
                sdkError = false;
                reportStage("sdk_load", startedAt, "success");
                resolve(globalThis.VGSCollect);
              } else {
                reject(new Error("VGS Collect did not initialize"));
              }
            };
            script.onerror = () => reject(new Error("VGS Collect failed to load"));
            document.head.appendChild(script);
          }).catch((loadError) => {
            sdkError = true;
            sdkPromise = null;
            reportStage("sdk_load", startedAt, "failure");
            throw loadError;
          });
          return sdkPromise;
        };

        const parseBootstrap = () => {
          const bootstrap = globalThis.openai?.toolResponseMetadata?.vgs_collect_bootstrap;
          if (!bootstrap || typeof bootstrap !== "object") return null;
          if (typeof bootstrap.vault_id !== "string" || !bootstrap.vault_id.trim()) return null;
          if (typeof bootstrap.access_token !== "string" || !bootstrap.access_token.trim()) return null;
          if (bootstrap.environment !== "sandbox" && bootstrap.environment !== "live") return null;
          return bootstrap;
        };

        const successfulResult = (response) => {
          const content = response?.structuredContent ?? response?.structured_content;
          if (response?.isError === true || content?.ok !== true) {
            throw new Error("Wallet did not confirm card registration");
          }
          return content;
        };

        const finalizeCard = async () => {
          if (!registrationReadyToFinalize) return;
          const startedAt = performance.now();
          submit.disabled = true;
          submit.textContent = messages.submitting;
          try {
            const result = successfulResult(await globalThis.openai.callTool(finalizeTool, {}));
            if (!result.card || typeof result.card.last4 !== "string") {
              throw new Error("Wallet did not confirm the saved card");
            }
            vaultedCardId = null;
            registrationReadyToFinalize = false;
            reportStage("save", startedAt, "success");
          } catch {
            reportStage("save", startedAt, "failure");
            showError(messages.saveError, messages.retrySave);
          }
        };

        const registerCard = async () => {
          if (!vaultedCardId) return;
          const startedAt = performance.now();
          submit.disabled = true;
          submit.textContent = messages.submitting;
          try {
            const result = successfulResult(await globalThis.openai.callTool(registerTool, {
              vgs_card_id: vaultedCardId,
            }));
            if (typeof result.registration_id !== "string" || !result.registration_id.trim()) {
              throw new Error("Wallet did not provide a registration session");
            }
            vaultedCardId = null;
            if (result.status === "verification_required") {
              if (!Array.isArray(result.verification_options) || result.verification_options.length === 0) {
                throw new Error("Wallet did not provide a verification option");
              }
              verificationOption.replaceChildren();
              for (const option of result.verification_options) {
                if (typeof option?.option_id !== "string" || typeof option?.value !== "string") {
                  throw new Error("Wallet returned an invalid verification option");
                }
                const choice = document.createElement("option");
                choice.value = option.option_id;
                choice.textContent = option.value;
                verificationOption.append(choice);
              }
              fieldsRoot.hidden = true;
              document.getElementById("privacy").hidden = true;
              verification.hidden = false;
              submit.hidden = true;
              return;
            }
            if (result.status !== "ready_to_finalize") {
              throw new Error("Wallet returned an unknown verification status");
            }
            registrationReadyToFinalize = true;
            await finalizeCard();
          } catch {
            reportStage("save", startedAt, "failure");
            showError(messages.saveError, messages.retrySave);
          }
        };

        requestCodeButton.addEventListener("click", async () => {
          requestCodeButton.disabled = true;
          try {
            const result = successfulResult(await globalThis.openai.callTool(requestCodeTool, {
              option_id: verificationOption.value,
            }));
            if (result.status !== "verification_code_sent") {
              throw new Error("Wallet did not send a verification code");
            }
            codeFields.hidden = false;
            verificationCode.value = "";
            error.dataset.visible = "false";
            verificationCode.focus();
          } catch {
            error.textContent = messages.verificationError;
            error.dataset.visible = "true";
          } finally {
            requestCodeButton.disabled = false;
          }
        });

        verifyCodeButton.addEventListener("click", async () => {
          if (!/^[0-9]{6}$/.test(verificationCode.value)) {
            error.textContent = messages.verificationError;
            error.dataset.visible = "true";
            return;
          }
          verifyCodeButton.disabled = true;
          try {
            const result = successfulResult(await globalThis.openai.callTool(verifyTool, {
              otp: verificationCode.value,
            }));
            if (result.status !== "ready_to_finalize") {
              throw new Error("Wallet did not verify the card");
            }
            registrationReadyToFinalize = true;
            verification.hidden = true;
            await finalizeCard();
          } catch {
            error.textContent = messages.verificationError;
            error.dataset.visible = "true";
          } finally {
            verifyCodeButton.disabled = false;
          }
        });

        const initializeFields = async (attempt, bootstrap) => {
          const startedAt = performance.now();
          resetForm();
          let initializationTimeout;
          let timedOut = false;
          try {
            await Promise.race([
              (async () => {
                const collect = await loadSdk();
                if (activeAttempt !== attempt || timedOut) return;
                form = collect.create(bootstrap.vault_id, bootstrap.environment, () => undefined);
                form.on?.("enterPress", () => {
                  if (!submit.disabled) formRoot.requestSubmit(submit);
                });
                const css = getFieldCss();
                fields = [
                  form.cardNumberField("#vgs-card-number", { css, placeholder: messages.numberPlaceholder }),
                  form.cardExpirationDateField("#vgs-card-expiration", { css, placeholder: messages.expirationPlaceholder }),
                  form.cardCVCField("#vgs-card-cvc", { css, placeholder: messages.cvcPlaceholder }),
                ];
                fields.forEach((field, index) => {
                  field.on("update", (state) => {
                    fieldValidity[index] = state?.isValid === true;
                    submit.disabled = fieldValidity.some((valid) => !valid);
                  });
                });
                await Promise.all(fields.map((field) => field.promise ?? Promise.resolve()));
                if (activeAttempt !== attempt || timedOut) return;
                if (fields.some((field) => field.loadingState !== "loaded")) {
                  throw new Error("A VGS field did not finish loading");
                }
                formRoot.dataset.fieldsReady = "true";
                fieldsRoot.setAttribute("aria-busy", "false");
                status.textContent = "";
                reportStage("fields_ready", startedAt, "success");
              })(),
              new Promise((_, reject) => {
                initializationTimeout = setTimeout(() => {
                  timedOut = true;
                  reject(new Error("VGS fields did not finish loading in time"));
                }, fieldInitializationTimeoutMs);
              }),
            ]);
          } catch {
            if (activeAttempt !== attempt) return;
            reportStage("fields_ready", startedAt, "failure");
            showError(sdkError ? messages.error : messages.bootstrapError, messages.retry);
          } finally {
            clearTimeout(initializationTimeout);
          }
        };

        const syncGlobals = () => {
          applyHostStyles();
          const css = getFieldCss();
          for (const field of fields) {
            field.update?.({ css });
          }
          const input = globalThis.openai?.toolInput;
          if (!input || input.enrollment_requested !== true) {
            if (activeAttempt !== null) {
              activeAttempt = null;
              resetForm();
            }
            return;
          }
          const attempt = String(input.enrollment_attempt) + ":" + String(input.bootstrap_retry);
          if (input.bootstrap_status === "error") {
            activeAttempt = attempt;
            showError(messages.bootstrapError, messages.retry);
            return;
          }
          if (input.bootstrap_status !== "ready") {
            showLoading();
            return;
          }
          if (activeAttempt === attempt) return;
          const bootstrap = parseBootstrap();
          if (!bootstrap) {
            activeAttempt = attempt;
            showError(messages.bootstrapError, messages.retry);
            return;
          }
          activeAttempt = attempt;
          void initializeFields(attempt, bootstrap);
        };

        formRoot.addEventListener("submit", (event) => {
          event.preventDefault();
          if (!verification.hidden) {
            if (!codeFields.hidden) verifyCodeButton.click();
            return;
          }
          const bootstrap = parseBootstrap();
          if (!form || !bootstrap || fieldValidity.some((valid) => !valid)) return;
          const startedAt = performance.now();
          submit.disabled = true;
          submit.textContent = messages.submitting;
          error.dataset.visible = "false";
          try {
            form.createCard(
              { auth: bootstrap.access_token, data: { cardholder: {} } },
              (statusCode, payload) => {
                if (statusCode === 401 || statusCode === 403) {
                  reportStage("submit", startedAt, "failure");
                  showError(messages.bootstrapError, messages.retry);
                  return;
                }
                const card = payload?.data;
                if (statusCode < 200 || statusCode >= 300 || !card || typeof card.id !== "string" || !card.id.trim()) {
                  reportStage("submit", startedAt, "failure");
                  showError(messages.error, messages.retry);
                  return;
                }
                vaultedCardId = card.id;
                reportStage("submit", startedAt, "success");
                void registerCard();
              },
              () => {
                reportStage("submit", startedAt, "failure");
                error.textContent = messages.validationError;
                error.dataset.visible = "true";
                submit.disabled = fieldValidity.some((valid) => !valid);
                submit.textContent = messages.submit;
              },
            );
          } catch {
            reportStage("submit", startedAt, "failure");
            showError(messages.error, messages.retry);
          }
        });

        retry.addEventListener("click", () => {
          if (registrationReadyToFinalize || vaultedCardId) {
            error.dataset.visible = "false";
            retry.dataset.visible = "false";
            submit.hidden = false;
            if (registrationReadyToFinalize) void finalizeCard();
            else void registerCard();
            return;
          }
          showLoading();
          void globalThis.openai.callTool(retryTool, {}).catch(() => {
            showError(messages.bootstrapError, messages.retry);
          });
        });

        globalThis.addEventListener("openai:set_globals", syncGlobals);
        void loadSdk().catch(() => undefined);
        syncGlobals();
      })();
    <\/script>
  </body>
</html>`}var U,W,G,K,q,J,Oe,Y,ke;function Ae(){return(Ae=e((()=>{U=`__wallet_onboarding_retry_bootstrap`,W=`__wallet_onboarding_register_vgs_card`,G=`__wallet_onboarding_request_verification`,K=`__wallet_onboarding_verify_card`,q=`__wallet_onboarding_finalize_card`,J=`__wallet_onboarding_stage`,Oe={baseUriDomains:[],connectDomains:[`https://js.verygoodvault.com`,`https://js3.verygoodvault.com`,`https://vgs-collect-keeper.apps.verygood.systems`,`https://*.verygoodproxy.com`],frameDomains:[`https://js.verygoodvault.com`,`https://js3.verygoodvault.com`,`https://vgs-collect-keeper.apps.verygood.systems`],includeDefaultDomains:!1,isTrusted:!0,resourceDomains:[`https://js.verygoodvault.com`,`https://js3.verygoodvault.com`,`https://vgs-collect-keeper.apps.verygood.systems`]},Y=`https://js.verygoodvault.com/vgs-collect/3.2.2/vgs-collect.js`,ke=15e3})))()}function je(e){let t=(0,Je.c)(6),r;t[0]===e.enrollmentView?r=t[1]:(r=z({view:e.enrollmentView}),t[0]=e.enrollmentView,t[1]=r);let a=r,o=i(ge,a),s;return t[2]!==a||t[3]!==o||t[4]!==e?(s=o==null?null:(0,Ye.jsx)(Me,{...e,resourceIdentity:{context:a,identity:o}},n([o])),t[2]=a,t[3]=o,t[4]=e,t[5]=s):s=t[5],s}function Me(e){let t=(0,Je.c)(87),{active:n,enrollmentAttempt:r,enrollmentView:a,onComplete:o,onPreparationError:s,onPrepared:c,preparing:l,targetElement:f,resourceIdentity:p}=e,m=_(re),h=oe(),v=d(Ce),b=(0,X.useId)(),x=(0,X.useRef)(n),S=(0,X.useRef)(!1),C=(0,X.useRef)(null),ee=(0,X.useRef)(null),te;t[0]===Symbol.for(`react.memo_cache_sentinel`)?(te=new Map,t[0]=te):te=t[0];let w=(0,X.useRef)(te),[T,ne]=(0,X.useState)(0),[E,D]=(0,X.useState)(null),[O,ie]=(0,X.useState)(null),[k,ae]=(0,X.useState)(null),[A,ce]=(0,X.useState)(!1),M=p.identity.kind===`connector`?p.identity.connectorId:null,le;t[1]!==h.locale||t[2]!==p.identity?(le={identity:p.identity,locale:h.locale,widgetDomain:null},t[1]=h.locale,t[2]=p.identity,t[3]=le):le=t[3];let{data:ue}=i(ye,le),N=ue?.sourceUrl,P;t[4]===N?P=t[5]:(P=N==null?null:me(N),t[4]=N,t[5]=P);let F=P,I=`wallet-onboarding-${b}`,L;t[6]!==n||t[7]!==E?.metadata||t[8]!==M||t[9]!==a.hostId||t[10]!==a.server||t[11]!==a.serverTools||t[12]!==o||t[13]!==s||t[14]!==c||t[15]!==l||t[16]!==p||t[17]!==m?(L=async(e,t)=>{if(m.get(de,p)!==`current`)throw Error(`Wallet enrollment account changed`);if(e===`__wallet_onboarding_stage`){let e=et.parse(t);return y.info(`wallet_onboarding_sandbox.stage`,{safe:e}),l&&e.stage===`fields_ready`&&(e.result===`success`?c():s()),{}}if(e===`__wallet_onboarding_retry_bootstrap`){if(!n)throw Error(`Wallet onboarding enrollment is not active`);return tt.parse(t),ne(Ke),{}}if(e!==`__wallet_onboarding_register_vgs_card`&&e!==`__wallet_onboarding_request_verification`&&e!==`__wallet_onboarding_verify_card`&&e!==`__wallet_onboarding_finalize_card`)throw Error(`Wallet onboarding sandbox cannot call this tool`);if(!n&&(e!==`__wallet_onboarding_finalize_card`||C.current==null))throw Error(`Wallet onboarding enrollment is not active`);let r=async(e,t)=>{let n=RegExp(`(?:^|[._])(?:wallet_)?${e}$`),r=a.serverTools.find(e=>n.test(e.name));if(r==null)throw Error(`Wallet registration tool is unavailable`);let i=_e({connectorId:M,server:a.server,toolName:r.name,tools:a.serverTools}),o=await he(m,a.hostId,a.server,i.name,t);if(m.get(de,p)!==`current`)throw Error(`Wallet enrollment account changed while calling its tool`);return we({isCodexAppsServer:xe(a.server),toolResult:o})};if(e===`__wallet_onboarding_register_vgs_card`){let e=Ze.parse(t);if(!Xe.safeParse(E?.metadata).success)throw Error(`Wallet card enrollment is unavailable`);C.current=null;let n=await r(`register_vgs_agentic_token`,{vgs_card_id:e.vgs_card_id}),i=Qe.safeParse(n.structuredContent);return n.isError!==!0&&i.success&&(C.current={id:i.data.registration_id,optionIds:new Set(i.data.verification_options.map(Ge))}),n}let i=C.current;if(i==null)throw Error(`Wallet card registration is unavailable`);if(e===`__wallet_onboarding_request_verification`){let{option_id:e}=u({option_id:j()}).parse(t);if(!i.optionIds.has(e))throw Error(`Wallet verification option is unavailable`);return r(`request_vgs_card_verification`,{registration_id:i.id,option_id:e})}if(e===`__wallet_onboarding_verify_card`){let{otp:e}=u({otp:j().regex(/^[0-9]{6}$/)}).parse(t);return r(`verify_vgs_card`,{registration_id:i.id,otp:e})}u({}).strict().parse(t);let d=await r(`finalize_vgs_card_registration`,{registration_id:i.id});return d.isError!==!0&&$e.safeParse(d.structuredContent).success&&(C.current=null,x.current?o():S.current=!0),d},t[6]=n,t[7]=E?.metadata,t[8]=M,t[9]=a.hostId,t[10]=a.server,t[11]=a.serverTools,t[12]=o,t[13]=s,t[14]=c,t[15]=l,t[16]=p,t[17]=m,t[18]=L):L=t[18];let fe=(0,X.useEffectEvent)(L),R;t[19]===s?R=t[20]:(R=()=>{s()},t[19]=s,t[20]=R);let z=(0,X.useEffectEvent)(R),B;t[21]!==n||t[22]!==o?(B=()=>{n&&S.current&&(S.current=!1,o())},t[21]=n,t[22]=o,t[23]=B):B=t[23];let ge=(0,X.useEffectEvent)(B),V,H;t[24]===F?(V=t[25],H=t[26]):(V=()=>{if(F==null)return;let e=document.createElement(`webview`);return e.className=`h-full w-full overflow-hidden border-0`,e.setAttribute(`partition`,g(F)),ae(e),()=>{e.remove(),e.destroy?.(),ae(t=>t===e?null:t)}},H=[F],t[24]=F,t[25]=V,t[26]=H),(0,X.useLayoutEffect)(V,H);let be;t[27]!==n||t[28]!==ge||t[29]!==k||t[30]!==f?(be=()=>{if(x.current=n,ge(),k==null)return;let e=n?f:ee.current;e!=null&&k.parentElement!==e&&e.appendChild(k)},t[27]=n,t[28]=ge,t[29]=k,t[30]=f,t[31]=be):be=t[31];let Se;t[32]!==n||t[33]!==k||t[34]!==f?(Se=[n,k,f],t[32]=n,t[33]=k,t[34]=f,t[35]=Se):Se=t[35],(0,X.useLayoutEffect)(be,Se);let Te;t[36]!==z||t[37]!==fe||t[38]!==h||t[39]!==k||t[40]!==F||t[41]!==m||t[42]!==N||t[43]!==I?(Te=()=>{if(k==null||F==null||N==null)return;let e=se(N,{requireSkybridge:!0});if(e==null){y.warning(`wallet_onboarding_sandbox.invalid_origin`,{safe:{}}),z();return}let t=new AbortController,n,r=performance.now();ce(!1);let i=document.documentElement.dataset.theme===`dark`?`dark`:`light`,a=m.get(Ce),o=De({bootstrapError:h.formatMessage(Z.bootstrapError),cardNumber:h.formatMessage(Z.cardNumber),cvc:h.formatMessage(Z.cvc),cvcPlaceholder:h.formatMessage(Z.cvcPlaceholder),error:h.formatMessage(Z.error),expiration:h.formatMessage(Z.expiration),expirationPlaceholder:h.formatMessage(Z.expirationPlaceholder),initializing:h.formatMessage(Z.initializing),numberPlaceholder:h.formatMessage(Z.numberPlaceholder),privacy:h.formatMessage(Z.privacy),retry:h.formatMessage(Z.retry),retrySave:h.formatMessage(Z.retrySave),saveError:h.formatMessage(Z.saveError),sendCode:h.formatMessage(Z.sendCode),submit:h.formatMessage(Z.submit),submitting:h.formatMessage(Z.submitting),title:h.formatMessage(Z.title),validationError:h.formatMessage(Z.validationError),verificationCode:h.formatMessage(Z.verificationCode),verificationError:h.formatMessage(Z.verificationError),verificationOption:h.formatMessage(Z.verificationOption),verifyCode:h.formatMessage(Z.verifyCode)},{styleVariables:a,theme:i});return pe({hostApiHandlers:{callMcp:We,callTool:(e,t)=>fe(e,t),notifyBackgroundColor:Ue,notifyEnvironmentError:()=>{y.warning(`wallet_onboarding_sandbox.environment_error`,{safe:{}}),z()},notifyIntrinsicHeight:He,notifyIntrinsicWidth:Ve,notifyNavigation:Be,notifySecurityPolicyViolation:()=>{y.warning(`wallet_onboarding_sandbox.csp_violation`,{safe:{}}),z()},openExternal:ze,requestDisplayMode:Re,sendFollowUpMessage:Le,sendInstrument:Ie,updateWidgetState:Fe},origin:e,sandboxId:F,signal:t.signal,sourceUrl:N,webview:k}).then(async e=>{if(t.signal.aborted)return;ie(e);let s=e.runWidgetCode({csp:Oe,displayMode:`inline`,features:[],html:o,isFirstParty:!1,isSidebarOpen:!1,isTombstone:!1,maxHeight:620,maxWidth:568,measureWidth:!1,mcpApps:{hostCapabilities:{sandbox:{csp:Oe}},hostContext:{availableDisplayModes:[`inline`],containerDimensions:{maxHeight:620,maxWidth:568},deviceCapabilities:{hover:!0,touch:!1},displayMode:`inline`,locale:h.locale,platform:`desktop`,safeAreaInsets:{bottom:0,left:0,right:0,top:0},styles:{variables:a},theme:i,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,userAgent:`chatgpt`},hostInfo:{name:`chatgpt`}},safeArea:{insets:{bottom:0,left:0,right:0,top:0}},theme:i,toolInput:null,toolOutput:null,toolResponseMetadata:null,userAgent:{capabilities:{hover:!0,touch:!1},device:{os:`unknown`,platform:`native`,type:`desktop`}},viewParams:null,widgetId:I,widgetState:null});n=setTimeout(()=>{t.signal.aborted||(y.warning(`wallet_onboarding_sandbox.init_failed`,{safe:{errorName:`TimeoutError`}}),z(),t.abort())},nt),await qe(s,t.signal,()=>{clearTimeout(n),ce(!0),y.info(`wallet_onboarding_sandbox.initialized`,{safe:{durationMs:Math.max(0,Math.round(performance.now()-r))}})})===`ended`&&(clearTimeout(n),t.signal.aborted||(y.warning(`wallet_onboarding_sandbox.init_failed`,{safe:{errorName:`MissingRunningStatus`}}),z()))}).catch(e=>{t.signal.aborted||(y.warning(`wallet_onboarding_sandbox.init_failed`,{safe:{errorName:e instanceof Error?e.name:`UnknownError`}}),z())}),()=>{clearTimeout(n),t.abort(),ce(!1),ie(null)}},t[36]=z,t[37]=fe,t[38]=h,t[39]=k,t[40]=F,t[41]=m,t[42]=N,t[43]=I,t[44]=Te):Te=t[44];let Ee;t[45]!==h||t[46]!==k||t[47]!==F||t[48]!==m||t[49]!==N||t[50]!==I?(Ee=[h,k,F,m,N,I],t[45]=h,t[46]=k,t[47]=F,t[48]=m,t[49]=N,t[50]=I,t[51]=Ee):Ee=t[51],(0,X.useLayoutEffect)(Te,Ee);let U;t[52]!==T||t[53]!==M||t[54]!==r||t[55]!==a.hostId||t[56]!==a.server||t[57]!==a.tool.name||t[58]!==z||t[59]!==l||t[60]!==m?(U=()=>{if(!l||r===0)return;let e=JSON.stringify([M,a.hostId,a.server,a.tool.name,r,T]);D({attempt:r,metadata:null,retry:T,status:`loading`});let t=w.current.get(e);if(t==null){let n=performance.now();t=he(m,a.hostId,a.server,a.tool.name,{}).then(e=>(y.info(`wallet_onboarding_sandbox.bootstrap`,{safe:{durationMs:Math.max(0,Math.round(performance.now()-n))}}),e)),w.current.set(e,t)}let n=!1,i=setTimeout(()=>{n||(n=!0,y.warning(`wallet_onboarding_sandbox.bootstrap_failed`,{safe:{errorName:`TimeoutError`}}),D({attempt:r,metadata:null,retry:T,status:`error`}),z())},nt);return t.then(e=>{if(n)return;let t=we({isCodexAppsServer:xe(a.server),toolResult:e}),i=ve({toolResult:t}),o=Xe.safeParse(i);D({attempt:r,metadata:o.success?o.data:null,retry:T,status:o.success?`ready`:`error`}),o.success||z()}).catch(e=>{n||(y.warning(`wallet_onboarding_sandbox.bootstrap_failed`,{safe:{errorName:e instanceof Error?e.name:`UnknownError`}}),D({attempt:r,metadata:null,retry:T,status:`error`}),z())}).finally(()=>{clearTimeout(i)}),()=>{n=!0,clearTimeout(i)}},t[52]=T,t[53]=M,t[54]=r,t[55]=a.hostId,t[56]=a.server,t[57]=a.tool.name,t[58]=z,t[59]=l,t[60]=m,t[61]=U):U=t[61];let W;t[62]!==T||t[63]!==M||t[64]!==r||t[65]!==a.hostId||t[66]!==a.server||t[67]!==a.tool.name||t[68]!==l||t[69]!==m?(W=[T,M,r,a.hostId,a.server,a.tool.name,l,m],t[62]=T,t[63]=M,t[64]=r,t[65]=a.hostId,t[66]=a.server,t[67]=a.tool.name,t[68]=l,t[69]=m,t[70]=W):W=t[70],(0,X.useEffect)(U,W);let G,K;t[71]!==v||t[72]!==h.locale||t[73]!==A||t[74]!==O?(G=()=>{if(!A||O==null)return;let e=document.documentElement.dataset.theme===`dark`?`dark`:`light`;Promise.all([O.setTheme({theme:e}),O.notifyMcpAppsHostContext({hostContext:{availableDisplayModes:[`inline`],containerDimensions:{maxHeight:620,maxWidth:568},deviceCapabilities:{hover:!0,touch:!1},displayMode:`inline`,locale:h.locale,platform:`desktop`,safeAreaInsets:{bottom:0,left:0,right:0,top:0},styles:{variables:v},theme:e,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,userAgent:`chatgpt`}})]).catch(Pe)},K=[v,h.locale,A,O],t[71]=v,t[72]=h.locale,t[73]=A,t[74]=O,t[75]=G,t[76]=K):(G=t[75],K=t[76]),(0,X.useEffect)(G,K);let q,J;t[77]!==E||t[78]!==r||t[79]!==v||t[80]!==A||t[81]!==l||t[82]!==O||t[83]!==I?(q=()=>{if(!A||O==null)return;let e=l&&E?.attempt===r?E:null;O.setWidgetData({toolInput:e==null?null:{bootstrap_retry:e.retry,bootstrap_status:e.status,enrollment_attempt:e.attempt,enrollment_requested:!0,style_variables:v},toolOutput:null,toolResponseMetadata:e?.metadata??null,widgetId:I,widgetState:null}).catch(Ne)},J=[E,r,v,A,l,O,I],t[77]=E,t[78]=r,t[79]=v,t[80]=A,t[81]=l,t[82]=O,t[83]=I,t[84]=q,t[85]=J):(q=t[84],J=t[85]),(0,X.useEffect)(q,J);let Y;return t[86]===Symbol.for(`react.memo_cache_sentinel`)?(Y=(0,Ye.jsx)(`div`,{ref:ee,"aria-hidden":`true`,className:`pointer-events-none fixed h-px w-px overflow-hidden opacity-0`}),t[86]=Y):Y=t[86],Y}function Ne(){}function Pe(){}function Fe(){}function Ie(){}function Le(){return Promise.reject(Error(`Wallet onboarding sandbox cannot send follow-ups`))}function Re(){return{mode:`inline`}}function ze(){}function Be(){}function Ve(){}function He(){}function Ue(){}function We(){return Promise.reject(Error(`Wallet onboarding sandbox cannot make MCP requests`))}function Ge(e){return e.option_id}function Ke(e){return e+1}async function qe(e,t,n){for await(let r of e){if(t.aborted)return`aborted`;if(I.safeParse(r).success)return n(),`running`}return`ended`}var Je,X,Ye,Xe,Ze,Qe,$e,et,tt,nt,Z;function rt(){return(rt=e((()=>{Je=t(),ae(),s(),le(),T(),X=ie(),h(),k(),R(),Se(),fe(),B(),be(),F(),L(),Ee(),H(),b(),E(),Ae(),Ye=f(),Xe=u({vgs_collect_bootstrap:u({access_token:j().trim().min(1),environment:ue([`sandbox`,`live`]),vault_id:j().trim().min(1)})}),Ze=u({vgs_card_id:j().trim().min(1)}),Qe=u({ok:x(!0),registration_id:j().trim().min(1),status:ue([`ready_to_finalize`,`verification_required`]),verification_options:o(u({option_id:j()}))}),$e=u({card:u({last4:j()}),ok:x(!0)}),et=u({duration_ms:te().nonnegative(),result:ue([`failure`,`success`]),stage:ue([`fields_ready`,`save`,`sdk_load`,`submit`])}),tt=u({}).strict(),nt=15e3,Z=c({bootstrapError:{id:`codexWalletOnboardingEnrollment.bootstrapError`,defaultMessage:`The secure card session is unavailable or expired`,description:`Error shown when Wallet onboarding cannot authorize VGS Collect`},cardNumber:{id:`codexWalletOnboardingEnrollment.cardNumber`,defaultMessage:`Card number`,description:`Label for the Wallet onboarding secure card-number field`},cvc:{id:`codexWalletOnboardingEnrollment.cvc`,defaultMessage:`Security code`,description:`Label for the Wallet onboarding secure card-security-code field`},cvcPlaceholder:{id:`codexWalletOnboardingEnrollment.cvcPlaceholder`,defaultMessage:`3 digits`,description:`Placeholder for the Wallet onboarding secure card-security-code field`},error:{id:`codexWalletOnboardingEnrollment.error`,defaultMessage:`We couldn't add this card`,description:`Generic error shown when Wallet onboarding cannot add a card`},expiration:{id:`codexWalletOnboardingEnrollment.expiration`,defaultMessage:`Expiration date`,description:`Label for the Wallet onboarding secure card-expiration field`},expirationPlaceholder:{id:`codexWalletOnboardingEnrollment.expirationPlaceholder`,defaultMessage:`00/00`,description:`Placeholder for the Wallet onboarding secure card-expiration field`},initializing:{id:`codexWalletOnboardingEnrollment.initializing`,defaultMessage:`Preparing secure card fields…`,description:`Status shown while Wallet onboarding prepares the secure card fields`},numberPlaceholder:{id:`codexWalletOnboardingEnrollment.numberPlaceholder`,defaultMessage:`16 digits`,description:`Length hint shown inside the Wallet onboarding secure card-number field`},privacy:{id:`codexWalletOnboardingEnrollment.privacy`,defaultMessage:`Fully encrypted and never shared with third party apps`,description:`Privacy explanation shown below Wallet onboarding secure card fields`},retry:{id:`codexWalletOnboardingEnrollment.retry`,defaultMessage:`Try again`,description:`Button that retries Wallet onboarding secure-field initialization`},retrySave:{id:`codexWalletOnboardingEnrollment.retrySave`,defaultMessage:`Save to Wallet`,description:`Button that retries saving a secured card to Wallet`},saveError:{id:`codexWalletOnboardingEnrollment.saveError`,defaultMessage:`Your card was secured, but Wallet couldn't save it`,description:`Error shown when Wallet onboarding cannot save an already secured card`},sendCode:{id:`codexWalletOnboardingEnrollment.sendCode`,defaultMessage:`Send verification code`,description:`Button to request a one-time card issuer verification code`},submit:{id:`codexWalletOnboardingEnrollment.submit`,defaultMessage:`Add card`,description:`Button that submits the Wallet onboarding secure card form`},submitting:{id:`codexWalletOnboardingEnrollment.submitting`,defaultMessage:`Adding card…`,description:`Status shown while Wallet onboarding adds the secured card`},title:{id:`codexWalletOnboardingEnrollment.title`,defaultMessage:`Add new card`,description:`Heading for the Wallet onboarding secure card form`},validationError:{id:`codexWalletOnboardingEnrollment.validationError`,defaultMessage:`Check your card details and try again`,description:`Error shown when Wallet onboarding secure fields reject card details`},verificationCode:{id:`codexWalletOnboardingEnrollment.verificationCode`,defaultMessage:`Six-digit verification code`,description:`Label for the one-time code received from the card issuer`},verificationError:{id:`codexWalletOnboardingEnrollment.verificationError`,defaultMessage:`We couldn't verify this card. Try again`,description:`Error shown when the card issuer rejects a verification request or code`},verificationOption:{id:`codexWalletOnboardingEnrollment.verificationOption`,defaultMessage:`Where should we send the verification code?`,description:`Label for choosing a masked email address or phone number supplied by the card issuer`},verifyCode:{id:`codexWalletOnboardingEnrollment.verifyCode`,defaultMessage:`Verify and save`,description:`Button to verify the card issuer's code and save the card to Wallet`}})})))()}function it(e){let t=(0,ct.c)(2),n;return t[0]===e?n=t[1]:(n=(0,$.jsx)(at,{...e},e.enrollmentView.hostId),t[0]=e,t[1]=n),n}function at(e){let t=(0,ct.c)(20),{dismissAnnouncement:n,enrollmentView:r}=e,[i,a]=(0,Q.useState)(`introduction`),[o,s]=(0,Q.useState)(1),[c,l]=(0,Q.useState)(!1),[u,d]=(0,Q.useState)(`loading`),[f,p]=(0,Q.useState)(null),m;t[0]!==n||t[1]!==c||t[2]!==u||t[3]!==i?(m=i===`introduction`?(0,$.jsx)(lt,{dismissAnnouncement:n,isSettingUpWallet:c&&u===`loading`,onSetUpWallet:()=>{l(!0),u!==`loading`&&a(`enrollment`)}}):(0,$.jsx)(st,{completed:i===`success`,dismissAnnouncement:n,preparationFailed:u===`error`,setSandboxTarget:p,onBack:()=>{l(!1),a(`introduction`)},onRetry:()=>{d(`loading`),s(ot)}}),t[0]=n,t[1]=c,t[2]=u,t[3]=i,t[4]=m):m=t[4];let h=i===`enrollment`&&u!==`error`,g;t[5]===Symbol.for(`react.memo_cache_sentinel`)?(g=()=>{a(`success`)},t[5]=g):g=t[5];let _,v;t[6]===c?(_=t[7],v=t[8]):(_=()=>{d(`error`),c&&a(`enrollment`)},v=()=>{d(`ready`),c&&a(`enrollment`)},t[6]=c,t[7]=_,t[8]=v);let y=i!==`success`&&u!==`error`,b;t[9]!==o||t[10]!==r||t[11]!==f||t[12]!==h||t[13]!==_||t[14]!==v||t[15]!==y?(b=(0,$.jsx)(je,{active:h,enrollmentAttempt:o,enrollmentView:r,onComplete:g,onPreparationError:_,onPrepared:v,preparing:y,targetElement:f},o),t[9]=o,t[10]=r,t[11]=f,t[12]=h,t[13]=_,t[14]=v,t[15]=y,t[16]=b):b=t[16];let x;return t[17]!==m||t[18]!==b?(x=(0,$.jsxs)($.Fragment,{children:[m,b]}),t[17]=m,t[18]=b,t[19]=x):x=t[19],x}function ot(e){return e+1}function st(e){let t=(0,ct.c)(22),{completed:n,dismissAnnouncement:i,onBack:a,onRetry:o,preparationFailed:s,setSandboxTarget:c}=e,l=s!==void 0&&s,u=V(),d;t[0]===Symbol.for(`react.memo_cache_sentinel`)?(d={"aria-describedby":void 0},t[0]=d):d=t[0];let f;t[1]===Symbol.for(`react.memo_cache_sentinel`)?(f=(0,$.jsx)(w,{id:`codexWalletOnboardingEnrollmentModal.close`,defaultMessage:`Close`,description:`Accessible label for closing ChatGPT Wallet card enrollment`}),t[1]=f):f=t[1];let m;t[2]===i?m=t[3]:(m=e=>{e||i()},t[2]=i,t[3]=m);let h;t[4]!==n||t[5]!==o||t[6]!==l||t[7]!==c||t[8]!==u?(h=n?(0,$.jsx)(A.div,{animate:{opacity:1,y:0},className:`flex min-h-0 flex-1 items-center justify-center px-6 select-none`,initial:!u&&{opacity:0,y:12},transition:{duration:u?0:.28},children:(0,$.jsx)(r,{className:`items-center text-center`,icon:(0,$.jsx)(A.span,{animate:{rotate:0,scale:1},className:`flex`,initial:!u&&{rotate:-18,scale:0},transition:u?{duration:0}:{damping:18,delay:.12,stiffness:320,type:`spring`},children:(0,$.jsx)(C,{"aria-hidden":!1,asset:M})}),iconBackgroundClassName:`bg-chart-green/20`,iconClassName:`mx-auto text-chart-green`,title:(0,$.jsx)(S,{children:(0,$.jsx)(w,{id:`codexWalletOnboardingEnrollmentModal.successTitle`,defaultMessage:`Your card was successfully saved`,description:`Heading shown after a card is saved during ChatGPT Wallet onboarding`})}),subtitle:(0,$.jsx)(w,{id:`codexWalletOnboardingEnrollmentModal.successDescription`,defaultMessage:`You’re ready to go`,description:`Confirmation shown after a card is saved during ChatGPT Wallet onboarding`})})}):l?(0,$.jsxs)(`div`,{className:`flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center select-none`,children:[(0,$.jsx)(S,{children:(0,$.jsx)(w,{id:`codexWalletOnboardingEnrollmentModal.preparationErrorTitle`,defaultMessage:`Unable to add your card`,description:`Heading shown when Wallet onboarding cannot initialize secure card enrollment`})}),(0,$.jsx)(`p`,{role:`alert`,className:`text-secondary`,children:(0,$.jsx)(w,{id:`codexWalletOnboardingEnrollmentModal.preparationError`,defaultMessage:`The secure card session is unavailable or expired`,description:`Error shown when Wallet onboarding cannot initialize secure card enrollment`})}),(0,$.jsx)(ne,{className:`w-full justify-center`,color:`primary`,size:`large`,onClick:o,children:(0,$.jsx)(w,{id:`codexWalletOnboardingEnrollmentModal.retryPreparation`,defaultMessage:`Try again`,description:`Button that retries secure Wallet card-enrollment initialization`})})]}):(0,$.jsxs)($.Fragment,{children:[(0,$.jsx)(S,{className:`sr-only`,children:(0,$.jsx)(w,{id:`codexWalletOnboardingEnrollmentModal.title`,defaultMessage:`Add a card to ChatGPT Wallet`,description:`Accessible title for ChatGPT Wallet card enrollment`})}),(0,$.jsx)(`div`,{ref:c,className:`relative min-h-0 flex-1 overflow-hidden bg-surface`})]}),t[4]=n,t[5]=o,t[6]=l,t[7]=c,t[8]=u,t[9]=h):h=t[9];let g=n?`primary`:`ghostTertiary`,_=n?i:a,v;t[10]===n?v=t[11]:(v=n?(0,$.jsx)(w,{id:`codexWalletOnboardingEnrollmentModal.continue`,defaultMessage:`Continue`,description:`Button that closes the ChatGPT Wallet onboarding announcement after a card is saved`}):(0,$.jsx)(w,{id:`codexWalletOnboardingEnrollmentModal.back`,defaultMessage:`Back`,description:`Button that returns from Wallet card enrollment to the Wallet introduction`}),t[10]=n,t[11]=v);let y;t[12]!==g||t[13]!==_||t[14]!==v?(y=(0,$.jsx)(`div`,{className:`shrink-0 bg-surface px-6 pb-6`,children:(0,$.jsx)(ne,{className:`w-full justify-center`,color:g,size:`large`,onClick:_,children:v})}),t[12]=g,t[13]=_,t[14]=v,t[15]=y):y=t[15];let b;t[16]!==h||t[17]!==y?(b=(0,$.jsxs)(`div`,{className:`flex h-full min-h-0 flex-col`,children:[h,y]}),t[16]=h,t[17]=y,t[18]=b):b=t[18];let x;return t[19]!==b||t[20]!==m?(x=(0,$.jsx)(p,{open:!0,contentClassName:`h-[min(504px,calc(100dvh-32px))] w-[min(480px,92vw)] !rounded-[16px] !bg-surface !ring-0 !backdrop-blur-none`,contentProps:d,dialogCloseClassName:`z-10`,dialogCloseLabel:f,onOpenChange:m,size:`feature`,children:b}),t[19]=b,t[20]=m,t[21]=x):x=t[21],x}var ct,Q,$,lt;function ut(){return(ut=e((()=>{ct=t(),N(),O(),Q=ie(),h(),D(),P(),v(),a(),ce(),Te(),rt(),$=f(),l(),lt=m(async()=>(await ee(async()=>{let{WalletOnboardingAnnouncementModal:e}=await import(`./wallet-onboarding-announcement-modal-28bb7ad132a0.js`);return{WalletOnboardingAnnouncementModal:e}},__vite__mapDeps([0,1,2,3,4,5,6]),import.meta.url)).WalletOnboardingAnnouncementModal,{propagateLoadError:!0})})))()}ut();export{it as WalletOnboardingAnnouncement};
//# sourceMappingURL=wallet-onboarding-announcement-content-378e0ff97194.js.map