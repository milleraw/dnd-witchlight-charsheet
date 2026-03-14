// assets/js/common/level-up.js
(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function ensureBackdrop() {
    let backdrop = document.getElementById("modal-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "modal-backdrop";
      backdrop.className = "hidden";
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  function ensureModal() {
    let modal = document.getElementById("level-up-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "level-up-modal";
      modal.className = "modal hidden";
      modal.innerHTML = `
        <div class="modal-content">
          <h3 class="modal-title">Level Up</h3>
          <div class="modal-body">
            <div class="lu-body">
              <div class="lu-row lu-header">
                <div class="lu-title" id="lu-character-name"></div>
                <div class="lu-meta" id="lu-character-meta"></div>
              </div>

              <div class="lu-row">
                <label class="lu-label" for="lu-new-level">New level</label>
                <input id="lu-new-level" type="number" min="1" max="20" step="1" />
                <div class="lu-hint" id="lu-level-hint"></div>
              </div>

              <div class="lu-row">
                <label class="lu-label" for="lu-hp-gain">HP gained</label>
                <input id="lu-hp-gain" type="number" min="0" step="1" />
                <div class="lu-hint" id="lu-hp-hint"></div>
                <label class="lu-inline">
                  <input id="lu-hp-current" type="checkbox" checked />
                  Also increase current HP
                </label>
              </div>

              <div class="lu-row lu-options">
                <div class="lu-section-title">This level includes</div>
                <div class="lu-options-grid">
                  <div class="lu-options-group">
                    <div class="lu-options-title">Class features</div>
                    <ul id="lu-class-features" class="lu-list"></ul>
                  </div>
                  <div class="lu-options-group">
                    <div class="lu-options-title">Subclass features</div>
                    <ul id="lu-subclass-features" class="lu-list"></ul>
                  </div>
                  <div class="lu-options-group">
                    <div class="lu-options-title">Class actions</div>
                    <ul id="lu-class-actions" class="lu-list"></ul>
                  </div>
                  <div class="lu-options-group">
                    <div class="lu-options-title">Subclass actions</div>
                    <ul id="lu-subclass-actions" class="lu-list"></ul>
                  </div>
                  <div class="lu-options-group">
                    <div class="lu-options-title">Subclass spells & cantrips</div>
                    <div id="lu-subclass-spells" class="lu-checklist"></div>
                  </div>
                </div>
              </div>

              <div class="lu-row lu-choices hidden" id="lu-choices-section">
                <div class="lu-section-title">Choices this level</div>
                <div id="lu-dynamic-choices" class="lu-choices-grid"></div>
                <div class="lu-choices-grid">
                  <div class="lu-choice-block hidden" id="lu-specialist-choice">
                    <label class="lu-label" for="lu-specialist-select">Artificer specialist</label>
                    <select id="lu-specialist-select"></select>
                    <div class="lu-hint">Choose your Artificer specialty at level 3.</div>
                  </div>
                  <div class="lu-choice-block hidden" id="lu-specialist-feature">
                    <label class="lu-label" for="lu-specialist-notes">Specialist feature choice</label>
                    <textarea id="lu-specialist-notes" rows="2" placeholder="Record the feature or choice taken."></textarea>
                  </div>
                  <div class="lu-choice-block hidden" id="lu-infusions-choice">
                    <div class="lu-label">Infusions known</div>
                    <div class="lu-hint" id="lu-infusions-hint"></div>
                    <div id="lu-infusions-list" class="lu-checklist"></div>
                  </div>
                </div>
              </div>

              <div class="lu-row lu-asi hidden" id="lu-asi-section">
                <div class="lu-section-title">Ability Score Increase or Feat</div>
                <div class="lu-radio-row">
                  <label class="lu-inline"><input type="radio" name="lu-asi-mode" value="asi" checked /> Ability Score Increase</label>
                  <label class="lu-inline"><input type="radio" name="lu-asi-mode" value="feat" /> Feat</label>
                </div>
                <div class="lu-asi-fields" id="lu-asi-fields">
                  <div class="lu-asi-row">
                    <label class="lu-label" for="lu-asi-1">Ability +1</label>
                    <select id="lu-asi-1"></select>
                  </div>
                  <div class="lu-asi-row">
                    <label class="lu-label" for="lu-asi-2">Ability +1</label>
                    <select id="lu-asi-2"></select>
                  </div>
                  <label class="lu-inline">
                    <input id="lu-asi-double" type="checkbox" />
                    Use +2 to the same ability
                  </label>
                </div>
                <div class="lu-feat-fields hidden" id="lu-feat-fields">
                  <label class="lu-label" for="lu-feat-name">Feat</label>
                  <select id="lu-feat-name"></select>
                  <div id="lu-feat-desc" class="lu-hint"></div>
                  <div id="lu-feat-choices" class="lu-choice-list"></div>
                  <label class="lu-label" for="lu-feat-notes">Feat notes</label>
                  <textarea id="lu-feat-notes" rows="2" placeholder="Optional details or choices"></textarea>
                </div>
              </div>

              <div class="lu-row">
                <label class="lu-label" for="lu-notes">Other choices / notes</label>
                <textarea id="lu-notes" rows="3" placeholder="Subclass features, spell choices, class options, etc."></textarea>
              </div>

              <div class="lu-row lu-file">
                <div class="lu-file-status" id="lu-file-status">File save: not linked</div>
                <button id="lu-pick-dir" type="button">Select data folder</button>
                <div class="lu-hint">Pick the local <code>data</code> folder to allow direct JSON writes.</div>
              </div>

              <div class="lu-row lu-error hidden" id="lu-error"></div>
            </div>
          </div>
          <div class="modal-actions">
            <button id="lu-cancel">Cancel</button>
            <button id="lu-apply" class="primary-btn">Apply Level Up</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    return modal;
  }

  function fmtMod(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return "+0";
    const mod = Math.floor((n - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  function getConMod(character) {
    const score = Number(character?.abilities?.CON ?? character?.abilities?.con ?? 10) || 10;
    return Math.floor((score - 10) / 2);
  }

  function setVisibility(el, show) {
    if (!el) return;
    el.classList.toggle("hidden", !show);
  }

  function readRadio(name) {
    const input = document.querySelector(`input[name="${name}"]:checked`);
    return input ? input.value : null;
  }

  async function loadSubclassesForLevelUp() {
    try {
      const res = await fetch("data/subclasses.json", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) return json;
      }
    } catch (_) {
      // fall through to local loader
    }
    return (await window.loadSubclassesLocal?.()) || [];
  }

  function listOrNone(items, emptyLabel = "None") {
    if (!Array.isArray(items) || !items.length) return [{ name: emptyLabel, desc: "" }];
    return items;
  }

  function setList(container, items) {
    if (!container) return;
    container.innerHTML = "";
    for (const item of listOrNone(items)) {
      const li = document.createElement("li");
      li.textContent = item.name || item;
      if (item.desc) {
        li.classList.add("tooltip");
        li.setAttribute("data-tooltip", item.desc);
      }
      container.appendChild(li);
    }
  }

  function renderGrantedSpellList(container, items) {
    if (!container) return;
    container.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "lu-empty";
      empty.textContent = "None";
      container.appendChild(empty);
      return;
    }
    for (const entry of items) {
      const row = document.createElement("div");
      row.className = "lu-check";
      row.innerHTML = `<span>${entry.label || entry.name}</span>`;
      container.appendChild(row);
    }
  }

  async function renderDecisionChoices(container, plan, current) {
    if (!container) return;
    container.innerHTML = "";
    if (!plan || !Array.isArray(plan.choices)) return;

    const knownInfusions = (current?.infusions?.known || []).map(s => String(s).toLowerCase());
    const renderSimpleChoiceBlock = (choice, parent) => {
      const block = document.createElement("div");
      block.className = "lu-choice-block";
      block.dataset.choiceId = choice.id || "";
      block.dataset.choiceType = choice.type || "";

      const label = document.createElement("label");
      label.className = "lu-label";
      label.textContent = choice.prompt || "Choice";
      const tipText = String(choice.tooltip || (choice.type === "boolean" ? (choice.notes || "") : "")).trim();
      if (tipText) {
        label.classList.add("tooltip");
        label.setAttribute("data-tooltip", tipText);
      }
      block.appendChild(label);

      if (choice.notes && !(choice.type === "boolean" && choice.tooltip)) {
        const hint = document.createElement("div");
        hint.className = "lu-hint";
        hint.textContent = choice.notes;
        block.appendChild(hint);
      }

      if (choice.type === "note") {
        const textarea = document.createElement("textarea");
        textarea.rows = 2;
        textarea.placeholder = "Record your choice.";
        textarea.dataset.choiceId = choice.id || "";
        block.appendChild(textarea);
      } else if (choice.type === "boolean") {
        const select = document.createElement("select");
        select.dataset.choiceId = choice.id || "";
        select.innerHTML = `
          <option value="">-- choose --</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        `;
        block.appendChild(select);
      } else {
        const options = (choice.options || []).map(o => (typeof o === "string" ? { label: o, value: o } : o));
        const count = Number(choice.count || choice.max || 1) || 1;
        for (let i = 0; i < count; i++) {
          const select = document.createElement("select");
          select.dataset.choiceId = choice.id || "";
          select.innerHTML = ['<option value="">-- choose --</option>']
            .concat(options.map(o => `<option value="${o.value || o.name || o.label || ""}">${o.label || o.name || o.value || ""}</option>`))
            .join("");
          block.appendChild(select);
        }
        if (options.some(o => o?.raw?.desc)) {
          const list = document.createElement("ul");
          list.className = "lu-list";
          for (const opt of options) {
            if (!opt?.raw?.desc) continue;
            const li = document.createElement("li");
            li.textContent = `${opt.label || opt.value}: ${opt.raw.desc}`;
            list.appendChild(li);
          }
          if (list.children.length) block.appendChild(list);
        }
        if (choice.allowCustom) {
          const input = document.createElement("input");
          input.type = "text";
          input.placeholder = "Custom entry";
          input.dataset.choiceId = choice.id || "";
          input.className = "lu-custom-input";
          block.appendChild(input);
        }
      }

      parent.appendChild(block);
      return block;
    };

    for (const choice of plan.choices) {
      const block = document.createElement("div");
      block.className = "lu-choice-block";
      block.dataset.choiceId = choice.id || "";
      block.dataset.choiceType = choice.type || "";

      const label = document.createElement("label");
      label.className = "lu-label";
      label.textContent = choice.prompt || "Choice";
      const tipText = String(choice.tooltip || (choice.type === "boolean" ? (choice.notes || "") : "")).trim();
      if (tipText) {
        label.classList.add("tooltip");
        label.setAttribute("data-tooltip", tipText);
      }
      block.appendChild(label);

      if (choice.notes && !(choice.type === "boolean" && choice.tooltip)) {
        const hint = document.createElement("div");
        hint.className = "lu-hint";
        hint.textContent = choice.notes;
        block.appendChild(hint);
      }

      if (choice.type === "asi") {
        const note = document.createElement("div");
        note.className = "lu-hint";
        note.textContent = "Use the Ability Score Increase / Feat section below.";
        block.appendChild(note);
      } else if (choice.type === "note") {
        const textarea = document.createElement("textarea");
        textarea.rows = 2;
        textarea.placeholder = "Record your choice.";
        textarea.dataset.choiceId = choice.id || "";
        block.appendChild(textarea);
      } else if (choice.type === "boolean") {
        const select = document.createElement("select");
        select.dataset.choiceId = choice.id || "";
        select.innerHTML = `
          <option value="">-- choose --</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        `;
        block.appendChild(select);
      } else if (choice.type === "infusion") {
        const hint = document.createElement("div");
        hint.className = "lu-hint";
        hint.textContent = `Choose ${choice.min || 0} infusion(s).`;
        block.appendChild(hint);
        const list = document.createElement("div");
        list.className = "lu-checklist";
        for (const entry of choice.options || []) {
          const isKnown = knownInfusions.includes(String(entry.name || "").toLowerCase());
          const row = document.createElement("label");
          row.className = "lu-check";
          row.innerHTML = `
            <input type="checkbox" data-choice-id="${choice.id || ""}" data-name="${entry.name || ""}" ${isKnown ? "checked disabled" : ""}>
            <span>${entry.name || ""}</span>
          `;
          if (entry.desc) {
            row.classList.add("tooltip");
            row.setAttribute("data-tooltip", entry.desc);
          }
          list.appendChild(row);
        }
        block.appendChild(list);
      } else if (choice.type === "cantrip" || choice.type === "spell") {
        const options = await getSpellOptionsForChoice(choice, plan?.level ?? 1, current);
        const count = Number(choice.count || choice.max || 1) || 1;
        for (let i = 0; i < count; i++) {
          const select = document.createElement("select");
          select.dataset.choiceId = choice.id || "";
          select.innerHTML = ['<option value="">-- choose --</option>']
            .concat(options.map(o => `<option value="${o}">${o}</option>`))
            .join("");
          block.appendChild(select);
        }
      } else if (choice.type === "spell_swap" || choice.type === "invocation_swap") {
        const list = await loadSpellList();
        const source = String(choice?.sourceList || choice?.list || "wizard").toLowerCase();
        const levelVal = Number(plan?.level || 1);
        const constraints = choice?.constraints || {};
        const levelExact = Number.isFinite(Number(constraints.level)) ? Number(constraints.level) : null;
        const classCantripOnly = !!constraints.classCantripOnly;
        const useSpellStateKnown = !!constraints.useSpellStateKnown;
        const maxLevel = (() => {
          if (Number.isFinite(Number(constraints.maxLevel))) return Number(constraints.maxLevel);
          if (String(choice?.progression || "").toLowerCase() === "third") return getThirdCasterMax(levelVal);
          return window.DDRules?.getMaxSpellLevelFor?.({ class: current?.class, level: levelVal }) || 0;
        })();
        const allowedSchools = Array.isArray(constraints.school_in) ? constraints.school_in.map(s => String(s).toLowerCase()) : [];
        const spellMap = new Map(list.map(s => [String(s?.name || "").toLowerCase(), s]));
          const anySchoolLevels = new Set([3, 8, 14, 20]);
        const anySchoolSpells = new Set(
          (current?.choices?.subclassSpellChoices || [])
            .filter(entry => anySchoolLevels.has(Number(entry?.level)))
            .flatMap(entry => entry?.values || [])
            .map(name => String(name || "").toLowerCase())
        );
        let known = [];
        if (choice.type === "invocation_swap") {
          known = (Array.isArray(choice?.fromOptions) ? choice.fromOptions : (current?.invocations || []))
            .map(name => String(name || ""))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
        } else if (useSpellStateKnown) {
          const st = window.readSpellState ? (window.readSpellState(current) || {}) : {};
          const preparedByLevel = (st && typeof st === "object" && st.preparedByLevel && typeof st.preparedByLevel === "object")
            ? st.preparedByLevel
            : {};
          known = Object.values(preparedByLevel)
            .flat()
            .map(name => String(name || ""))
            .filter(Boolean)
            .filter(name => {
              const spell = spellMap.get(name.toLowerCase());
              if (!spell || !spellMatchesClass(spell, source)) return false;
              const lvl = Number(spell.level ?? spell.level_int ?? 0);
              if (levelExact != null && lvl !== levelExact) return false;
              if (maxLevel != null && lvl > Number(maxLevel || 0)) return false;
              return true;
            })
            .sort((a, b) => a.localeCompare(b));
        } else {
          known = (current?.spells || [])
            .map(name => String(name || ""))
            .filter(Boolean)
            .filter(name => {
              const spell = spellMap.get(name.toLowerCase());
              if (!spell || !spellMatchesClass(spell, source)) return false;
              if (levelExact != null && Number(spell.level ?? spell.level_int ?? 0) !== levelExact) return false;
              // For Cantrip Versatility, rely on class-list membership + level 0.
              // Source tags can be incomplete/misaligned in legacy files.
              if (classCantripOnly) return true;
              return true;
            })
            .sort((a, b) => a.localeCompare(b));
        }

        const replaceLabel = document.createElement("div");
        replaceLabel.className = "lu-hint";
        replaceLabel.textContent = "Replace (optional)";
        block.appendChild(replaceLabel);

        const replaceSelect = document.createElement("select");
        replaceSelect.dataset.choiceId = choice.id || "";
        replaceSelect.innerHTML = ['<option value="">-- keep all spells --</option>']
          .concat(known.map(n => `<option value="${n}">${n}</option>`))
          .join("");
        block.appendChild(replaceSelect);

        const newLabel = document.createElement("div");
        newLabel.className = "lu-hint";
        newLabel.textContent = "New spell";
        block.appendChild(newLabel);

        const newSelect = document.createElement("select");
        newSelect.dataset.choiceId = choice.id || "";
        newSelect.innerHTML = '<option value="">-- choose --</option>';
        block.appendChild(newSelect);

        const updateNewOptions = async () => {
          const replaceName = replaceSelect.value || "";
          const replaceSpell = replaceName ? spellMap.get(replaceName.toLowerCase()) : null;
          const replaceSchool = replaceSpell ? getSpellSchool(replaceSpell) : "";
          const allowAny = (!!choice?.allowAnySchoolIfReplacingNonSchool
            && replaceSchool
            && allowedSchools.length
            && !allowedSchools.includes(replaceSchool))
            || (replaceName && anySchoolSpells.has(replaceName.toLowerCase()));
          const schools = allowAny ? [] : allowedSchools;

          let options = [];
          if (choice.type === "invocation_swap") {
            const invOpts = await loadInvocationOptions(levelVal, current, {
              nonWarlockNoPrereq: !!choice?.constraints?.non_warlock_cannot_choose_prereq_invocations
            });
            options = invOpts
              .map(o => String(o?.value || o?.name || o?.label || ""))
              .filter(Boolean)
              .filter(n => !replaceName || String(n).toLowerCase() !== replaceName.toLowerCase())
              .sort((a, b) => a.localeCompare(b));
          } else {
            options = list
              .filter(s => spellMatchesClass(s, source))
              .filter(s => levelExact == null || Number(s.level ?? s.level_int ?? 0) === levelExact)
              .filter(s => Number(s.level ?? s.level_int ?? 0) <= maxLevel)
              .filter(s => !schools.length || schools.includes(getSpellSchool(s)))
              .map(s => String(s.name || ""))
              .filter(Boolean)
              .filter(n => !replaceName || String(n).toLowerCase() !== replaceName.toLowerCase())
              .sort((a, b) => a.localeCompare(b));
          }

          newSelect.innerHTML = ['<option value="">-- choose --</option>']
            .concat(options.map(o => `<option value="${o}">${o}</option>`))
            .join("");
        };

        replaceSelect.addEventListener("change", () => { void updateNewOptions(); });
        void updateNewOptions();
      } else {
        const options = (choice.options || []).map(o => (typeof o === "string" ? { label: o, value: o } : o));
        const count = Number(choice.count || choice.max || 1) || 1;
        for (let i = 0; i < count; i++) {
          const select = document.createElement("select");
          select.dataset.choiceId = choice.id || "";
          select.innerHTML = ['<option value="">-- choose --</option>']
            .concat(options.map(o => `<option value="${o.value || o.name || o.label || ""}">${o.label || o.name || o.value || ""}</option>`))
            .join("");
          block.appendChild(select);
        }

        if (String(choice.id || "").includes("ranger_fighting_style")) {
          const subBlock = document.createElement("div");
          subBlock.className = "lu-subchoice";
          subBlock.dataset.subchoice = "druidic-warrior";
          subBlock.classList.add("hidden");

          const subLabel = document.createElement("div");
          subLabel.className = "lu-hint";
          subLabel.textContent = "Druidic Warrior: choose two druid cantrips.";
          subBlock.appendChild(subLabel);

          const cantrips = await getDruidCantripOptions();
          for (let i = 0; i < 2; i++) {
            const select = document.createElement("select");
            select.dataset.choiceId = `${choice.id || ""}:druidic-warrior`;
            select.innerHTML = ['<option value="">-- choose cantrip --</option>']
              .concat(cantrips.map(c => `<option value="${c}">${c}</option>`))
              .join("");
            subBlock.appendChild(select);
          }
          block.appendChild(subBlock);

          const syncDruidicWarrior = () => {
            const selected = block.querySelector("select[data-choice-id]")?.value || "";
            subBlock.classList.toggle("hidden", selected !== "Druidic Warrior");
          };
          block.querySelectorAll("select[data-choice-id]").forEach(sel => {
            sel.addEventListener("change", syncDruidicWarrior);
          });
          syncDruidicWarrior();
        }

        if (options.some(o => o?.raw?.desc)) {
          const list = document.createElement("ul");
          list.className = "lu-list";
          for (const opt of options) {
            if (!opt?.raw?.desc) continue;
            const li = document.createElement("li");
            li.textContent = `${opt.label || opt.value}: ${opt.raw.desc}`;
            list.appendChild(li);
          }
          if (list.children.length) block.appendChild(list);
        }
        if (choice.type === "subclass") {
          const preview = document.createElement("div");
          preview.className = "lu-subclass-preview";

          const title = document.createElement("div");
          title.className = "lu-hint";
          title.textContent = `Preview at level ${plan?.level ?? ""}`.trim();
          preview.appendChild(title);

          const featuresSection = document.createElement("div");
          const featuresLabel = document.createElement("div");
          featuresLabel.className = "lu-label";
          featuresLabel.textContent = "Features";
          const featuresList = document.createElement("ul");
          featuresList.className = "lu-list";
          featuresSection.appendChild(featuresLabel);
          featuresSection.appendChild(featuresList);
          preview.appendChild(featuresSection);

          const actionsSection = document.createElement("div");
          const actionsLabel = document.createElement("div");
          actionsLabel.className = "lu-label";
          actionsLabel.textContent = "Actions";
          const actionsList = document.createElement("ul");
          actionsList.className = "lu-list";
          actionsSection.appendChild(actionsLabel);
          actionsSection.appendChild(actionsList);
          preview.appendChild(actionsSection);

          const spellsSection = document.createElement("div");
          const spellsLabel = document.createElement("div");
          spellsLabel.className = "lu-label";
          spellsLabel.textContent = "Spells";
          const spellsList = document.createElement("ul");
          spellsList.className = "lu-list";
          spellsSection.appendChild(spellsLabel);
          spellsSection.appendChild(spellsList);
          preview.appendChild(spellsSection);

          const choicesSection = document.createElement("div");
          const choicesLabel = document.createElement("div");
          choicesLabel.className = "lu-label";
          choicesLabel.textContent = "Choices";
          const choicesList = document.createElement("ul");
          choicesList.className = "lu-list";
          choicesSection.appendChild(choicesLabel);
          choicesSection.appendChild(choicesList);
          preview.appendChild(choicesSection);

          block.appendChild(preview);

          const subclassChoicesWrap = document.createElement("div");
          subclassChoicesWrap.className = "lu-subclass-choices";
          block.appendChild(subclassChoicesWrap);

          const subclasses = await loadSubclassesForLevelUp();
          const className = plan?.className || current?.class || "";
          const levelVal = Number(plan?.level || 1);
          const updatePreview = async () => {
            const selected = block.querySelector("select[data-choice-id]")?.value || "";
            const subclassEntry = subclasses.find(s =>
              String(s.name || "").toLowerCase() === String(selected || "").toLowerCase() &&
              String(s.class || "").toLowerCase() === String(className || "").toLowerCase()
            );
            const features = normalizeFeaturesAtLevel(subclassEntry, levelVal);
            const actions = normalizeActionsAtLevel(subclassEntry, levelVal);
            const spells = normalizeSubclassSpellsAtLevel(subclassEntry, levelVal)
              .map(s => ({ name: s.label || s.name || "", desc: "" }))
              .filter(s => s.name);
            const subChoices = getSubclassChoicesAtLevel(subclassEntry, levelVal, selected).map(c => {
              const min = Number(c.min || 0);
              const max = Number(c.max || 0);
              let suffix = "";
              if (min || max) {
                suffix = min === max ? `(choose ${min})` : `(choose ${min}-${max || "any"})`;
              }
              return { name: `${c.prompt || c.name || "Choice"} ${suffix}`.trim(), desc: c.notes || "" };
            });

            setList(featuresList, features);
            setList(actionsList, actions);
            setList(spellsList, spells);
            setList(choicesList, subChoices);

            const dynamicChoices = getSubclassChoicesAtLevel(subclassEntry, levelVal, selected);
            plan.choices = plan.choices.filter(c => !c?._dynamicSubclass);
            subclassChoicesWrap.innerHTML = "";
            for (const rawChoice of dynamicChoices) {
              const count = Number(rawChoice?.count || rawChoice?.choose || rawChoice?.max || 1) || 1;
              let options = normalizeChoiceOptions(rawChoice?.options || []);
              const type = String(rawChoice?.type || "").toLowerCase();
              if (!options.length && (type === "cantrip" || type === "spell")) {
                const spellOptions = await getSpellOptionsForChoice(rawChoice, levelVal, current);
                options = normalizeChoiceOptions(spellOptions || []);
              }
              options = expandChoiceOptionsForPlan(rawChoice, options, current);
              const id = ensureChoiceId(`choice:subclass:${String(selected || "").toLowerCase().replace(/\s+/g, '-')}`, rawChoice);
              const isCavalierEitherOr = isCavalierBonusSkillOrLanguageChoice(rawChoice, selected);
              const dynamicChoice = {
                id,
                type: rawChoice?.type || "subclass-choice",
                prompt: rawChoice?.prompt || rawChoice?.name || "Subclass choice",
                min: Number(rawChoice?.min ?? (isCavalierEitherOr ? 0 : count)),
                max: Number(rawChoice?.max ?? count),
                count,
                notes: rawChoice?.notes || "",
                allowCustom: !!rawChoice?.allowCustom,
                options,
                _dynamicSubclass: true
              };
              plan.choices.push(dynamicChoice);
              renderSimpleChoiceBlock(dynamicChoice, subclassChoicesWrap);
            }
          };

          block.querySelectorAll("select[data-choice-id]").forEach(select => {
            select.addEventListener("change", () => { void updatePreview(); });
          });
          void updatePreview();
        }
        if (choice.allowCustom) {
          const input = document.createElement("input");
          input.type = "text";
          input.placeholder = "Custom entry";
          input.dataset.choiceId = choice.id || "";
          input.className = "lu-custom-input";
          block.appendChild(input);
        }
      }

      container.appendChild(block);
    }
  }

  function readDecisionSelections(container) {
    const selections = [];
    if (!container) return selections;
    const blocks = container.querySelectorAll(".lu-choice-block");
    blocks.forEach(block => {
      const choiceId = block.dataset.choiceId || "";
      const choiceType = block.dataset.choiceType || "";
      if (!choiceId) return;

      if (choiceType === "note") {
        const textarea = block.querySelector("textarea");
        const value = textarea?.value?.trim() || "";
        if (value) selections.push({ choiceId, type: choiceType, value });
      } else if (choiceType === "boolean") {
        const select = block.querySelector("select[data-choice-id]");
        const raw = String(select?.value || "").toLowerCase();
        if (!raw) return;
        const taken = raw === "true" || raw === "yes" || raw === "1";
        selections.push({ choiceId, type: choiceType, taken, value: taken ? "Taken" : "Not Taken" });
      } else if (choiceType === "infusion") {
        const checked = [];
        block.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          // Disabled checkboxes are already-known infusions; only count new picks.
          if (cb.disabled) return;
          if (cb.checked) checked.push(cb.dataset.name || "");
        });
        if (checked.length) selections.push({ choiceId, type: choiceType, values: checked });
      } else if (choiceType === "asi") {
        selections.push({ choiceId, type: choiceType });
      } else {
        const values = [];
        block.querySelectorAll("select[data-choice-id]").forEach(select => {
          if (select.closest(".lu-choice-block") !== block) return;
          if (select.value) values.push(select.value);
        });
        let cantrips = [];
        if (String(choiceId).includes("ranger_fighting_style")) {
          const subSelects = block.querySelectorAll('select[data-choice-id$=":druidic-warrior"]');
          cantrips = Array.from(subSelects).map(s => s.value).filter(Boolean);
        }
        const custom = block.querySelector(".lu-custom-input");
        if (custom?.value?.trim()) values.push(custom.value.trim());
        if (values.length || cantrips.length) {
          selections.push({ choiceId, type: choiceType, values, value: values[0], cantrips });
        }
      }
    });
    return selections;
  }

  async function validateDecisionSelections(plan, selections) {
    const errors = [];
    if (!plan || !Array.isArray(plan.choices)) return errors;
    const byId = new Map();
    selections.forEach(sel => {
      const list = byId.get(sel.choiceId) || [];
      list.push(sel);
      byId.set(sel.choiceId, list);
    });

    for (const choice of plan.choices) {
      if (choice.type === "asi") continue;
      const min = Number(choice.min || 0);
      const max = Number(choice.max || 0);
      const entries = byId.get(choice.id) || [];
      let count = 0;
      if (choice.type === "infusion") {
        count = entries[0]?.values?.length || 0;
      } else if (choice.type === "note") {
        count = entries[0]?.value ? 1 : 0;
      } else if (choice.type === "boolean") {
        count = 1;
      } else if (choice.type === "spell_swap" || choice.type === "invocation_swap") {
        const values = entries[0]?.values || [];
        const replaceName = values[0] || "";
        const newName = values[1] || "";
        count = (replaceName || newName) ? 1 : 0;
      } else {
        count = entries[0]?.values?.length || (entries[0]?.value ? 1 : 0);
      }
      let requiresSatisfied = true;
      if (choice?.requiresChoiceId && choice?.requiresTaken) {
        const req = (byId.get(choice.requiresChoiceId) || [])[0];
        requiresSatisfied = (typeof req?.taken === "boolean")
          ? req.taken
          : ["taken", "yes", "true", "1"].includes(String(req?.value || "").trim().toLowerCase());
      }
      if (min > 0 && requiresSatisfied && count < min) {
        errors.push(`Select at least ${min} option(s): ${choice.prompt || choice.id}`);
      }
      if (max > 0 && count > max) {
        errors.push(`Select no more than ${max} option(s): ${choice.prompt || choice.id}`);
      }
      if (choice?.requiresChoiceId && choice?.requiresTaken && !requiresSatisfied && count > 0) {
        errors.push(`Take the optional feature first: ${choice.prompt || choice.id}`);
      }
      if (choice.type === "cantrip" || choice.type === "spell") {
        const values = entries[0]?.values || [];
        if (values.length && new Set(values).size !== values.length) {
          errors.push(`Selections must be distinct: ${choice.prompt || choice.id}`);
        }
        const minSchoolCount = Number(choice?.constraints?.minSchoolCount || 0);
        const schools = Array.isArray(choice?.constraints?.school_in) ? choice.constraints.school_in.map(s => String(s).toLowerCase()) : [];
        if (minSchoolCount && schools.length && values.length) {
          const list = await loadSpellList();
          const map = new Map(list.map(s => [String(s?.name || "").toLowerCase(), s]));
          const count = values.reduce((sum, name) => {
            const spell = map.get(String(name || "").toLowerCase());
            if (!spell) return sum;
            return sum + (schools.includes(getSpellSchool(spell)) ? 1 : 0);
          }, 0);
          if (count < minSchoolCount) {
            errors.push(`Choose at least ${minSchoolCount} ${schools.join('/')} spell(s): ${choice.prompt || choice.id}`);
          }
        }
      }
      if (choice.type === "spell_swap" || choice.type === "invocation_swap") {
        const values = entries[0]?.values || [];
        const replaceName = values[0] || "";
        const newName = values[1] || "";
        if ((replaceName && !newName) || (!replaceName && newName)) {
          const label = choice.type === "invocation_swap" ? "invocation" : "spell";
          errors.push(`Complete both selections to replace an ${label}: ${choice.prompt || choice.id}`);
        }
        if (replaceName && newName && choice?.requiresChoiceId && choice?.requiresTaken) {
          const req = (byId.get(choice.requiresChoiceId) || [])[0];
          const taken = (typeof req?.taken === "boolean")
            ? req.taken
            : ["taken", "yes", "true", "1"].includes(String(req?.value || "").trim().toLowerCase());
          if (!taken) {
            errors.push(`Take the optional feature first: ${choice.prompt || choice.id}`);
          }
        }
      }
      if (String(choice.id || "").includes("ranger_fighting_style")) {
        const entry = entries[0] || {};
        if (entry.value === "Druidic Warrior" && (entry.cantrips || []).length !== 2) {
          errors.push("Choose two druid cantrips for Druidic Warrior.");
        }
      }
    }
    const cavSkillId = "choice:subclass:cavalier:cavalier_bonus_proficiency_skill";
    const cavLangId = "choice:subclass:cavalier:cavalier_bonus_proficiency_language";
    const hasCavPair = (plan.choices || []).some(c => c.id === cavSkillId) && (plan.choices || []).some(c => c.id === cavLangId);
    if (hasCavPair) {
      const countFor = (id) => {
        const entries = byId.get(id) || [];
        return entries[0]?.values?.length || (entries[0]?.value ? 1 : 0);
      };
      const total = countFor(cavSkillId) + countFor(cavLangId);
      if (total < 1) {
        errors.push("Cavalier Bonus Proficiency: choose either one listed skill or one language.");
      } else if (total > 1) {
        errors.push("Cavalier Bonus Proficiency: choose only one option (skill OR language), not both.");
      }
    }
    return errors;
  }

  function collectChoiceGrants(plan, selections) {
    const grants = [];
    if (!plan || !Array.isArray(plan.choices)) return grants;
    const byId = new Map(plan.choices.map(c => [c.id, c]));
    for (const sel of selections) {
      const choice = byId.get(sel.choiceId);
      if (!choice || !Array.isArray(choice.options)) continue;
      const values = sel.values || (sel.value ? [sel.value] : []);
      for (const value of values) {
        const option = choice.options.find(o => String(o.value || "").toLowerCase() === String(value || "").toLowerCase());
        const raw = option?.raw || null;
        if (raw?.grants) {
          grants.push({
            choiceId: sel.choiceId,
            value,
            grants: raw.grants
          });
        }
      }
    }
    return grants;
  }

  function normalizeFeaturesAtLevel(entry, level) {
    if (!entry) return [];
    const L = Number(level);
    const out = [];
    if (Array.isArray(entry.levels)) {
      const hit = entry.levels.find(r => Number(r.level) === L);
      for (const f of (hit?.features || [])) {
        out.push(typeof f === "string" ? { name: f, desc: "" } : { name: f?.name || "", desc: f?.desc || "" });
      }
      return out;
    }
    const byLevel = entry.features || {};
    const list = byLevel[String(L)] || [];
    for (const f of list) {
      out.push(typeof f === "string" ? { name: f, desc: "" } : { name: f?.name || "", desc: f?.desc || "" });
    }
    return out;
  }

  function normalizeActionsAtLevel(entry, level) {
    if (!entry || !Array.isArray(entry.actions)) return [];
    return entry.actions
      .filter(a => Number(a.level) === Number(level))
      .map(a => ({ name: a.name || "", desc: a.desc || "" }));
  }

  function subclassSpellSourceBadge(entry) {
    const name = String(entry?.name || "").trim();
    if (!name) return "Subclass";
    if (/domain/i.test(name)) return "Domain";
    const bits = name.split(/\s+/).filter(Boolean);
    return bits.length ? bits[bits.length - 1] : "Subclass";
  }

  function normalizeSubclassSpellsAtLevel(entry, level) {
    if (!entry) return [];
    const L = String(level);
    const out = [];
    const source = subclassSpellSourceBadge(entry);
    const always = entry.alwaysPreparedSpells?.[L] || [];
    const cantrips = entry.bonusCantrips?.[L] || entry.cantrips?.[L] || [];
    for (const s of always) {
      out.push({ name: s, label: `${s} (always prepared)`, kind: "spell", source });
    }
    for (const c of cantrips) {
      out.push({ name: c, label: `${c} (bonus cantrip)`, kind: "cantrip", source });
    }
    return out;
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function normalizeEntryChoicesAtLevel(entry, level) {
    if (!entry || !entry.choices) return [];
    const L = Number(level);
    const choices = entry.choices;
    if (Array.isArray(choices)) {
      return choices.filter(c => Number(c?.level) === L);
    }
    const list = choices[String(L)] || choices[L] || [];
    return Array.isArray(list) ? list : [];
  }

  const SUBCLASS_CHOICE_KEYS = new Set([
    "specialistChoice",
    "primalPathChoice",
    "bardCollegeChoice",
    "divineDomainChoice",
    "druidCircleChoice",
    "martialArchetypeChoice",
    "monasticTraditionChoice",
    "sacredOathChoice",
    "rangerArchetypeChoice",
    "roguishArchetypeChoice",
    "sorcerousOriginChoice",
    "otherworldlyPatronChoice",
    "arcaneTraditionChoice"
  ]);

  async function loadMetamagicOptions() {
    try {
      const res = await fetch("data/metamagic.json");
      if (!res.ok) return [];
      const list = await res.json();
      return (Array.isArray(list) ? list : [])
        .map(m => ({
          label: m.name || m.label || "",
          value: m.name || m.value || m.label || "",
          raw: m
        }))
        .filter(m => m.label);
    } catch (err) {
      console.warn("Failed to load metamagic.json", err);
      return [];
    }
  }

  function getChoiceCount(choice, level) {
    if (choice?.countByLevel && choice.countByLevel[String(level)] != null) {
      return Number(choice.countByLevel[String(level)]) || 1;
    }
    if (choice?.picksByLevel && choice.picksByLevel[String(level)] != null) {
      return Number(choice.picksByLevel[String(level)]) || 1;
    }
    if (choice?.spellsByLevel && choice.spellsByLevel[String(level)]?.picks != null) {
      return Number(choice.spellsByLevel[String(level)].picks) || 1;
    }
    if (choice?.picks != null) return Number(choice.picks) || 1;
    if (choice?.count != null) return Number(choice.count) || 1;
    if (choice?.choose != null) return Number(choice.choose) || 1;
    return 1;
  }

  function getChoiceLevels(choice) {
    if (!choice) return [];
    if (Array.isArray(choice.levels)) return choice.levels.map(Number);
    if (Number.isFinite(Number(choice.level))) return [Number(choice.level)];
    return [];
  }

  function pickSubclassNameSafe(character) {
    if (typeof window.pickSubclassName === "function") return window.pickSubclassName(character) || "";
    return character?.subclass || character?.build || "";
  }

  function getClassChoiceValues(character, idNeedle) {
    const choices = character?.choices?.classChoices || [];
    return choices
      .filter(c => String(c?.choiceId || "").toLowerCase().includes(String(idNeedle || "").toLowerCase()))
      .flatMap(c => {
        if (Array.isArray(c.values)) return c.values;
        if (c.value) return [c.value];
        return [];
      })
      .map(v => String(v || "").toLowerCase());
  }

  function getChoiceValuesFromHistory(character, idNeedle) {
    const needle = String(idNeedle || "").toLowerCase();
    const out = [];
    const classChoices = Array.isArray(character?.choices?.classChoices) ? character.choices.classChoices : [];
    for (const c of classChoices) {
      if (!String(c?.choiceId || "").toLowerCase().includes(needle)) continue;
      if (Array.isArray(c?.values)) out.push(...c.values);
      else if (c?.value) out.push(c.value);
    }
    const levelUpDecisions = Array.isArray(character?.choices?.levelUpDecisions) ? character.choices.levelUpDecisions : [];
    for (const row of levelUpDecisions) {
      for (const pick of (Array.isArray(row?.choices) ? row.choices : [])) {
        if (!String(pick?.choiceId || "").toLowerCase().includes(needle)) continue;
        if (Array.isArray(pick?.values)) out.push(...pick.values);
        else if (pick?.value) out.push(pick.value);
      }
    }
    return out.map(v => String(v || "").trim().toLowerCase()).filter(Boolean);
  }

  function wasOptionalClassFeatureTaken(character, optionalKey) {
    const key = String(optionalKey || "").trim().toLowerCase();
    if (!key) return false;
    const isTaken = (entry) => {
      if (typeof entry?.taken === "boolean") return entry.taken;
      const v = String(entry?.value || "").trim().toLowerCase();
      return ["taken", "yes", "y", "true", "1"].includes(v);
    };
    const classChoices = Array.isArray(character?.choices?.classChoices) ? character.choices.classChoices : [];
    for (const row of classChoices) {
      const id = String(row?.choiceId || "").toLowerCase();
      if (!id.includes(`:optional:${key}`)) continue;
      if (isTaken(row)) return true;
    }
    const levelUpDecisions = Array.isArray(character?.choices?.levelUpDecisions) ? character.choices.levelUpDecisions : [];
    for (const dec of levelUpDecisions) {
      for (const pick of (Array.isArray(dec?.choices) ? dec.choices : [])) {
        const id = String(pick?.choiceId || "").toLowerCase();
        if (!id.includes(`:optional:${key}`)) continue;
        if (isTaken(pick)) return true;
      }
    }
    return false;
  }

  function getTraitChosenValues(character, traitPrefix) {
    const needle = String(traitPrefix || "").toLowerCase();
    const traits = Array.isArray(character?.traits) ? character.traits : [];
    const out = [];
    for (const t of traits) {
      const name = String((typeof t === "string" ? t : t?.name) || "").trim();
      const m = name.match(/^([^:]+):\s*(.+)$/);
      if (!m) continue;
      if (String(m[1] || "").trim().toLowerCase() !== needle) continue;
      out.push(String(m[2] || "").trim());
    }
    return out.map(v => String(v || "").trim().toLowerCase()).filter(Boolean);
  }

  function normalizeFavoredOption(value, kind) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return raw;
    if (kind === "terrain") {
      // Accept accidental plural input (e.g., "grasslands") when matching option labels.
      if (raw.endsWith("s")) return raw.slice(0, -1);
    }
    return raw;
  }

  function characterHasPact(character, pactName) {
    const needle = String(pactName || "").toLowerCase();
    const picks = getClassChoiceValues(character, "pact_boon");
    return picks.some(p => p.toLowerCase().includes(needle));
  }

  function characterHasEldritchBlast(character) {
    const spells = Array.isArray(character?.spells) ? character.spells : [];
    return spells.some(s => String(s || "").toLowerCase() === "eldritch blast");
  }

  function characterHasPatron(character, patronName) {
    const subclass = pickSubclassNameSafe(character);
    return String(subclass || "").toLowerCase().includes(String(patronName || "").toLowerCase());
  }

  function isWarlockCharacter(character) {
    return String(character?.class || "").trim().toLowerCase() === "warlock";
  }

  function meetsInvocationPrereqs(inv, levelVal, character) {
    const prereqs = Array.isArray(inv?.prerequisites) ? inv.prerequisites : [];
    for (const prereq of prereqs) {
      const text = String(prereq || "").toLowerCase();
      const levelReq = text.match(/(\\d+)(?:st|nd|rd|th) level/);
      if (levelReq && Number(levelVal) < Number(levelReq[1])) return false;

      if (text.includes("pact of the tome") && !characterHasPact(character, "tome")) return false;
      if (text.includes("pact of the blade") && !characterHasPact(character, "blade")) return false;
      if (text.includes("pact of the chain") && !characterHasPact(character, "chain")) return false;
      if (text.includes("pact of the talisman") && !characterHasPact(character, "talisman")) return false;

      if (text.includes("eldritch blast") && !characterHasEldritchBlast(character)) return false;

      if (text.includes("patron")) {
        if (text.includes("hexblade") && !characterHasPatron(character, "hexblade")) return false;
        if (text.includes("archfey") && !characterHasPatron(character, "archfey")) return false;
        if (text.includes("fiend") && !characterHasPatron(character, "fiend")) return false;
        if (text.includes("great old one") && !characterHasPatron(character, "great old one")) return false;
        if (text.includes("raven queen") && !characterHasPatron(character, "raven queen")) return false;
        if (text.includes("seeker") && !characterHasPatron(character, "seeker")) return false;
      }

      if (text.includes("hex spell")) {
        const spells = Array.isArray(character?.spells) ? character.spells : [];
        const hasHex = spells.some(s => String(s || "").toLowerCase() === "hex");
        const isHexblade = characterHasPatron(character, "hexblade");
        if (!hasHex && !isHexblade) return false;
      }
    }
    return true;
  }

  async function loadInvocationOptions(levelVal, character, opts = {}) {
    const nonWarlockNoPrereq = !!opts.nonWarlockNoPrereq;
    const list = await loadInvocations();
    return (list || [])
      .filter(inv => {
        const prereqs = Array.isArray(inv?.prerequisites) ? inv.prerequisites : [];
        if (nonWarlockNoPrereq && !isWarlockCharacter(character) && prereqs.length > 0) return false;
        return meetsInvocationPrereqs(inv, levelVal, character);
      })
      .map(inv => ({
        label: inv.name,
        value: inv.name,
        raw: {
          desc: inv.desc
            ? [inv.desc, (inv.prerequisites || []).length ? `Prerequisites: ${(inv.prerequisites || []).join("; ")}` : ""]
              .filter(Boolean).join(" ")
            : (inv.prerequisites || []).length ? `Prerequisites: ${(inv.prerequisites || []).join("; ")}` : ""
        }
      }));
  }

  function buildOptionalFeatureNotes(optionalFeatures, levelVal, classEntry = null) {
    if (!optionalFeatures) return [];
    const notes = [];
    const humanize = (key) => String(key || "")
      .replace(/Levels$/, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .trim();
    const levelFeatures = normalizeFeaturesAtLevel(classEntry, levelVal);
    const findFeatureDesc = (name, key) => {
      const byName = slugify(String(name || ""));
      const byKey = slugify(humanize(key));
      const hit = levelFeatures.find(f => {
        const clean = slugify(String(f?.name || "").replace(/\(optional\)/ig, "").trim());
        return clean === byName || clean === byKey || clean.includes(byName) || byName.includes(clean) || clean.includes(byKey) || byKey.includes(clean);
      });
      return String(hit?.desc || "").trim();
    };
    Object.entries(optionalFeatures).forEach(([key, value]) => {
      if (Array.isArray(value) && value.map(Number).includes(Number(levelVal))) {
        const name = humanize(key);
        notes.push({ name, desc: findFeatureDesc(name, key) || "Optional feature available." });
      } else if (key.endsWith("SpellsByLevel") && value && value[String(levelVal)]) {
        const spells = Array.isArray(value[String(levelVal)]) ? value[String(levelVal)].join(", ") : "";
        notes.push({ name: humanize(key), desc: spells ? `Spells gained: ${spells}.` : "Optional spells available." });
      }
    });
    return notes;
  }

  function extractChoiceOptionsFromFeature(feature) {
    const desc = String(feature?.desc || "");
    if (!/one of the following|choose one of the following|choose one of these/i.test(desc)) return [];
    const lines = desc.split("\n").map(l => l.trim()).filter(Boolean);
    const options = [];
    for (const line of lines) {
      const match = line.match(/^([A-Z][A-Za-z0-9'’\- ]+)\.\s/);
      if (match) options.push(match[1].trim());
    }
    if (!options.length) {
      const inline = desc.match(/one of the following[^:]*:\s*([^\n]+)/i);
      if (inline && inline[1]) {
        const list = inline[1]
          .replace(/\.$/, "")
          .split(/,\s*|,\s*or\s+|\s+or\s+|\s+and\s+/i)
          .map(s => s.trim().replace(/^or\s+/i, ""))
          .filter(Boolean);
        options.push(...list);
      }
    }
    return options;
  }

  function deriveChoicesFromFeatures(features, prefix) {
    const derived = [];
    for (const feature of features || []) {
      const options = extractChoiceOptionsFromFeature(feature);
      if (options.length < 2) continue;
      const base = slugify(feature?.id || feature?.name || "feature");
      derived.push({
        id: `${prefix}:${base}`,
        type: "subclass-choice",
        prompt: `Choose ${feature?.name || "an option"}`,
        min: 1,
        max: 1,
        options: options.map(o => ({ label: o, value: o })),
        _derivedFromFeature: true
      });
    }
    return derived;
  }

  function getSubclassChoicesAtLevel(entry, level, subclassName) {
    const explicit = normalizeEntryChoicesAtLevel(entry, level);
    if (explicit.length) return explicit;
    const features = normalizeFeaturesAtLevel(entry, level);
    const derived = deriveChoicesFromFeatures(features, `choice:subclass:${slugify(subclassName) || "subclass"}:feature`);
    const merged = [...explicit];
    for (const d of derived) {
      if (!merged.some(m => String(m?.prompt || m?.name || "").toLowerCase() === String(d.prompt).toLowerCase())) {
        merged.push(d);
      }
    }
    return merged;
  }

  function ensureChoiceId(prefix, choice) {
    const raw = String(choice?.id || "");
    if (raw.startsWith("choice:")) return raw;
    const base = raw || choice?.name || "choice";
    return `${prefix}:${base}`;
  }

  function normalizeChoiceOptions(options) {
    if (!Array.isArray(options)) return [];
    return options.map(opt => {
      if (typeof opt === "string") return { label: opt, value: opt };
      const label = opt?.name || opt?.label || opt?.value || "";
      const value = opt?.value || opt?.name || label;
      return { label, value, raw: opt };
    }).filter(o => o.label);
  }

  function expandChoiceOptionsForPlan(choice, options, character) {
    const type = String(choice?.type || "").toLowerCase();
    const rows = Array.isArray(options) ? options.slice() : [];
    if (type !== "language") return rows;
    const hasAny = rows.some(o => String(o?.value || o?.label || "").trim().toLowerCase() === "any");
    if (!hasAny) return rows;
    const known = new Set((Array.isArray(character?.languages) ? character.languages : [])
      .map(v => String(v || "").trim().toLowerCase())
      .filter(Boolean));
    const pool = LANGUAGE_LIST
      .filter(l => !known.has(String(l || "").trim().toLowerCase()))
      .map(l => ({ label: l, value: l }));
    return pool.length ? pool : LANGUAGE_LIST.map(l => ({ label: l, value: l }));
  }

  function isCavalierBonusSkillOrLanguageChoice(choiceLike, subclassName) {
    const sub = String(subclassName || "").trim().toLowerCase();
    if (sub !== "cavalier") return false;
    const id = String(choiceLike?.id || "").toLowerCase();
    return id === "cavalier_bonus_proficiency_skill" || id === "cavalier_bonus_proficiency_language";
  }

  const SUBCLASS_LEVELS = {
    artificer: 3,
    barbarian: 3,
    bard: 3,
    cleric: 1,
    druid: 2,
    fighter: 3,
    monk: 3,
    paladin: 3,
    ranger: 3,
    rogue: 3,
    sorcerer: 1,
    warlock: 1,
    wizard: 2
  };

  const SUBCLASS_LABELS = {
    artificer: "Artificer Specialist",
    barbarian: "Primal Path",
    bard: "College",
    cleric: "Domain",
    druid: "Circle",
    fighter: "Martial Archetype",
    monk: "Way",
    paladin: "Oath",
    ranger: "Conclave",
    rogue: "Roguish Archetype",
    sorcerer: "Sorcerous Origin",
    warlock: "Patron",
    wizard: "School"
  };

  function getSubclassLabel(className) {
    const key = String(className || "").toLowerCase();
    return SUBCLASS_LABELS[key] || "Subclass";
  }

  function getSubclassLevel(classEntry, className) {
    const fromEntry = classEntry?.subclass_level || classEntry?.subclassLevel || null;
    if (typeof fromEntry === "number") return fromEntry;
    const key = String(className || "").toLowerCase();
    return SUBCLASS_LEVELS[key] || 3;
  }

  function chooseIndefiniteArticle(phrase) {
    const text = String(phrase || "").trim();
    if (!text) return "a";
    return /^[aeiou]/i.test(text) ? "an" : "a";
  }

  async function buildLevelUpDecisionPlan(character, level, opts) {
    const levelVal = Number(level) || 1;
    const oldLevel = Number(character?.level) || 1;
    const clsName = character?.class || "";
    const subclassName = window.pickSubclassName ? window.pickSubclassName(character) : "";
    const local = opts || (await resolveLevelOptions(character, levelVal));

    const classEntry = local?.classEntry || null;
    const subclassEntry = local?.subclassEntry || null;
    const subclasses = (Array.isArray(local?.subclasses) && local.subclasses.length)
      ? local.subclasses
      : await loadSubclassesForLevelUp();

    const plan = {
      level: levelVal,
      className: clsName,
      subclassName,
      classFeatures: local?.classFeatures || [],
      subclassFeatures: local?.subclassFeatures || [],
      classActions: local?.classActions || [],
      subclassActions: local?.subclassActions || [],
      subclassSpells: local?.subclassSpells || [],
      choices: []
    };

    const subclassLevel = getSubclassLevel(classEntry, clsName);
    if (!subclassName && levelVal >= subclassLevel) {
      const label = getSubclassLabel(clsName);
      const article = chooseIndefiniteArticle(label);
      const options = subclasses
        .filter(s => String(s.class || "").toLowerCase() === String(clsName).toLowerCase())
        .map(s => s.name);
      plan.choices.push({
        id: "choice:subclass",
        type: "subclass",
        prompt: `Choose ${article} ${label}`,
        min: 1,
        max: 1,
        options: options.map(o => ({ label: o, value: o }))
      });
    }

    if (hasASIAtLevel(levelVal, plan.classFeatures, classEntry)) {
      plan.choices.push({
        id: "choice:asi",
        type: "asi",
        prompt: "Choose Ability Score Increase or Feat",
        min: 1,
        max: 1,
        options: ["asi", "feat"]
      });
    }

    if (classEntry?.progression) {
      const clsSlug = slugify(clsName || "class");
      const prevCantripsKnown = Number(classEntry.progression?.[String(oldLevel)]?.cantripsKnown ?? 0) || 0;
      const nextCantripsKnown = Number(classEntry.progression?.[String(levelVal)]?.cantripsKnown ?? 0) || 0;
      const cantripDelta = Math.max(0, nextCantripsKnown - prevCantripsKnown);
      if (cantripDelta > 0) {
        plan.choices.push({
          id: `choice:class:${clsSlug}:cantrips-known`,
          type: "cantrip",
          prompt: `Choose ${cantripDelta} new ${clsName} cantrip${cantripDelta > 1 ? "s" : ""}`,
          min: cantripDelta,
          max: cantripDelta,
          count: cantripDelta,
          sourceList: clsSlug,
          constraints: { level: 0, excludeKnown: true }
        });
      }
    }

    if (classEntry?.choices) {
      const clsSlug = slugify(clsName || "class");
      const classChoices = classEntry.choices;

      if (classChoices.fightingStyleChoice) {
        const levels = getChoiceLevels(classChoices.fightingStyleChoice);
        if (levels.includes(levelVal)) {
          const idSuffix = clsSlug === "ranger" ? "ranger_fighting_style" : "fighting_style";
          plan.choices.push({
            id: `choice:class:${clsSlug}:${idSuffix}`,
            type: "fighting_style",
            prompt: "Choose a Fighting Style",
            min: 1,
            max: 1,
            options: normalizeChoiceOptions(classChoices.fightingStyleChoice.options || [])
          });
        }
      }

      if (classChoices.expertise || classChoices.expertiseChoice) {
        const entry = classChoices.expertise || classChoices.expertiseChoice;
        const levels = getChoiceLevels(entry);
        if (levels.includes(levelVal)) {
          const count = getChoiceCount(entry, levelVal);
          const options = entry.options
            ? normalizeChoiceOptions(entry.options)
            : normalizeChoiceOptions(SKILL_LIST);
          plan.choices.push({
            id: `choice:class:${clsSlug}:expertise`,
            type: "expertise",
            prompt: "Choose expertise",
            min: count,
            max: count,
            options,
            allowCustom: !entry.options,
            notes: entry.options ? "" : "Choose from skills you are proficient in."
          });
        }
      }

      if (classChoices.favoredEnemyChoice) {
        const levels = getChoiceLevels(classChoices.favoredEnemyChoice);
        if (levels.includes(levelVal)) {
          const count = getChoiceCount(classChoices.favoredEnemyChoice, levelVal);
          const picked = new Set(
            getChoiceValuesFromHistory(character, "favored_enemy")
              .concat(getTraitChosenValues(character, "favored enemy"))
              .map(v => normalizeFavoredOption(v, "enemy"))
          );
          const options = normalizeChoiceOptions(classChoices.favoredEnemyChoice.options || [])
            .filter(o => !picked.has(normalizeFavoredOption(String(o?.value || o?.label || "").trim(), "enemy")));
          plan.choices.push({
            id: `choice:class:${clsSlug}:favored_enemy`,
            type: "class-choice",
            prompt: "Choose a Favored Enemy",
            min: count,
            max: count,
            options
          });
        }
      }

      if (classChoices.favoredTerrainChoice) {
        const levels = getChoiceLevels(classChoices.favoredTerrainChoice);
        if (levels.includes(levelVal)) {
          const count = getChoiceCount(classChoices.favoredTerrainChoice, levelVal);
          const picked = new Set(
            getChoiceValuesFromHistory(character, "favored_terrain")
              .concat(getTraitChosenValues(character, "natural explorer"))
              .map(v => normalizeFavoredOption(v, "terrain"))
          );
          const options = normalizeChoiceOptions(classChoices.favoredTerrainChoice.options || [])
            .filter(o => !picked.has(normalizeFavoredOption(String(o?.value || o?.label || "").trim(), "terrain")));
          plan.choices.push({
            id: `choice:class:${clsSlug}:favored_terrain`,
            type: "class-choice",
            prompt: "Choose a Favored Terrain",
            min: count,
            max: count,
            options
          });
        }
      }

      if (classChoices.metamagicChoice) {
        const levels = getChoiceLevels(classChoices.metamagicChoice);
        if (levels.includes(levelVal)) {
          const count = getChoiceCount(classChoices.metamagicChoice, levelVal);
          plan.choices.push({
            id: `choice:class:${clsSlug}:metamagic`,
            type: "metamagic",
            prompt: "Choose Metamagic options",
            min: count,
            max: count,
            options: await loadMetamagicOptions()
          });
        }
      }

      if (classChoices.eldritchInvocationsChoice) {
        const levels = getChoiceLevels(classChoices.eldritchInvocationsChoice);
        if (levels.includes(levelVal)) {
          const count = getChoiceCount(classChoices.eldritchInvocationsChoice, levelVal);
          plan.choices.push({
            id: `choice:class:${clsSlug}:eldritch_invocations`,
            type: "invocation",
            prompt: "Choose Eldritch Invocations",
            min: count,
            max: count,
            options: await loadInvocationOptions(levelVal, character)
          });
        }
      }

      if (classChoices.pactBoonChoice) {
        const levels = getChoiceLevels(classChoices.pactBoonChoice);
        if (levels.includes(levelVal)) {
          plan.choices.push({
            id: `choice:class:${clsSlug}:pact_boon`,
            type: "class-choice",
            prompt: "Choose a Pact Boon",
            min: 1,
            max: 1,
            options: normalizeChoiceOptions(classChoices.pactBoonChoice.options || [])
          });
        }
      }

      if (classChoices.mysticArcanumChoice) {
        const levels = getChoiceLevels(classChoices.mysticArcanumChoice);
        if (levels.includes(levelVal)) {
          const entry = classChoices.mysticArcanumChoice.spellsByLevel?.[String(levelVal)];
          const count = Number(entry?.picks || 1) || 1;
          const spellLevel = Number(entry?.spellLevel || 0) || 0;
          plan.choices.push({
            id: `choice:class:${clsSlug}:mystic_arcanum_${spellLevel}`,
            type: "spell",
            prompt: `Choose Mystic Arcanum (level ${spellLevel})`,
            min: count,
            max: count,
            count,
            sourceList: "warlock",
            constraints: { level: spellLevel }
          });
        }
      }

      if (classChoices.magicalSecrets) {
        const levels = getChoiceLevels(classChoices.magicalSecrets);
        if (levels.includes(levelVal)) {
          const count = Number(classChoices.magicalSecrets.spellsPerPick || 2) || 2;
          const maxLevel = window.DDRules?.getMaxSpellLevelFor?.({ class: clsName, level: levelVal }) || 0;
          plan.choices.push({
            id: `choice:class:${clsSlug}:magical_secrets`,
            type: "spell",
            prompt: "Choose Magical Secrets spells",
            min: count,
            max: count,
            count,
            sourceList: "any",
            constraints: { maxLevel }
          });
        }
      }

      const optional = classChoices.optionalFeatures || {};
      if (optional.deftExplorerChoices?.[String(levelVal)] && wasOptionalClassFeatureTaken(character, "deft-explorer")) {
        const opts = optional.deftExplorerChoices[String(levelVal)];
        plan.choices.push({
          id: `choice:class:${clsSlug}:deft_explorer`,
          type: "class-choice",
          prompt: "Choose Deft Explorer (Optional)",
          min: 1,
          max: 1,
          options: normalizeChoiceOptions(opts)
        });
      }

      const optionalNotes = buildOptionalFeatureNotes(optional, levelVal, classEntry)
        .filter(n => !(optional.deftExplorerChoices?.[String(levelVal)] && String(n.name || "").toLowerCase().includes("deft explorer")));
      for (const note of optionalNotes) {
        const noteName = String(note?.name || "").toLowerCase();
        if (clsSlug === "barbarian" && noteName.includes("primal knowledge")) {
          const known = getKnownSkills(character);
          const options = BARBARIAN_SKILL_OPTIONS
            .filter(s => !known.has(String(s).toLowerCase()))
            .map(s => ({ label: s, value: s }));
          plan.choices.push({
            id: `choice:class:${clsSlug}:optional:primal-knowledge`,
            type: "boolean",
            prompt: "Optional Feature: Primal Knowledge",
            min: 1,
            max: 1,
            allowCustom: false,
            notes: note.desc || "Gain proficiency in one Barbarian class skill of your choice.",
            tooltip: note.desc || "Gain proficiency in one Barbarian class skill of your choice."
          });
          if (options.length) {
            plan.choices.push({
              id: `choice:class:${clsSlug}:optional:primal-knowledge:skill`,
              type: "class-choice",
              prompt: "Primal Knowledge Skill (if taken)",
              min: 0,
              max: 1,
              options,
              requiresChoiceId: `choice:class:${clsSlug}:optional:primal-knowledge`,
              requiresTaken: true,
              notes: "Choose one Barbarian class skill proficiency if you take Primal Knowledge."
            });
          }
          continue;
        }
        if (clsSlug === "monk" && noteName.includes("dedicated weapon")) {
          const dedicatedId = `choice:class:${clsSlug}:optional:dedicated-weapon`;
          const weaponOptions = getCarriedWeaponOptions(character).map(w => ({ label: w, value: w }));
          plan.choices.push({
            id: dedicatedId,
            type: "boolean",
            prompt: "Optional Feature: Dedicated Weapon",
            min: 1,
            max: 1,
            allowCustom: false,
            notes: note.desc || "When taken, choose one eligible weapon to count as a monk weapon until changed after a rest.",
            tooltip: note.desc || "When taken, choose one eligible weapon to count as a monk weapon until changed after a rest."
          });
          plan.choices.push({
            id: `${dedicatedId}:weapon`,
            type: "class-choice",
            prompt: "Dedicated Weapon (if taken)",
            min: 1,
            max: 1,
            options: weaponOptions,
            allowCustom: true,
            requiresChoiceId: dedicatedId,
            requiresTaken: true,
            notes: "Choose the weapon you are dedicating. You may also type a custom weapon name."
          });
          continue;
        }
        plan.choices.push({
          id: `choice:class:${clsSlug}:optional:${slugify(note.name)}`,
          type: "boolean",
          prompt: `Optional Feature: ${note.name}`,
          min: 1,
          max: 1,
          allowCustom: false,
          notes: note.desc,
          tooltip: note.desc
        });
      }

      const cantripVersatilityClasses = new Set(["cleric", "druid", "wizard", "sorcerer", "warlock", "bard"]);
      if (hasASIAtLevel(levelVal, plan.classFeatures, classEntry) && cantripVersatilityClasses.has(clsSlug)) {
        let toggleChoice = plan.choices.find(c => String(c?.id || "").includes(":optional:cantrip-versatility"));
        if (!toggleChoice) {
          toggleChoice = {
            id: `choice:class:${clsSlug}:optional:cantrip-versatility`,
            type: "boolean",
            prompt: "Optional Feature: Cantrip Versatility",
            min: 1,
            max: 1,
            allowCustom: false,
            notes: "When you reach a level that grants an Ability Score Improvement, you can replace one cantrip you know from this class with another cantrip from that class's spell list.",
            tooltip: "When you reach a level that grants an Ability Score Improvement, you can replace one cantrip you know from this class with another cantrip from that class's spell list."
          };
          plan.choices.push(toggleChoice);
        }

        const swapId = `choice:class:${clsSlug}:cantrip-versatility-swap`;
        if (!plan.choices.some(c => c.id === swapId)) {
          plan.choices.push({
            id: swapId,
            type: "spell_swap",
            prompt: "Cantrip Versatility: replace one class cantrip (optional)",
            min: 0,
            max: 1,
            sourceList: clsSlug,
            constraints: { level: 0, classCantripOnly: true },
            requiresChoiceId: toggleChoice.id,
            requiresTaken: true,
            notes: "If you took Cantrip Versatility above, you may replace one cantrip you know from this class with another cantrip from this class's spell list."
          });
        }
      }

      if (clsSlug === "ranger") {
        const prevKnown = rangerSpellsKnown(oldLevel);
        const nextKnown = rangerSpellsKnown(levelVal);
        if (prevKnown > 0 && nextKnown > 0) {
          plan.choices.push({
            id: "choice:class:ranger:spell-swap",
            type: "spell_swap",
            prompt: "Replace one Ranger spell (optional)",
            min: 0,
            max: 1,
            sourceList: "ranger",
            constraints: {
              maxLevel: window.DDRules?.getMaxSpellLevelFor?.({ class: "ranger", level: levelVal }) || 0,
              useSpellStateKnown: true
            },
            notes: "You may replace one ranger spell you know with another ranger spell you can cast."
          });
        }
      }
    }

    if (String(subclassName || "").toLowerCase() === "arcane trickster" && levelVal >= 4) {
      const prevKnown = arcaneTricksterSpellsKnown(Number(character?.level) || 1);
      const nextKnown = arcaneTricksterSpellsKnown(levelVal);
      const delta = Math.max(0, nextKnown - prevKnown);
      const anySchoolLevels = new Set([8, 14, 20]);
      if (delta > 0) {
        plan.choices.push({
          id: "choice:arcane-trickster:spells-known",
          type: "spell",
          prompt: "Choose Arcane Trickster spell(s)",
          min: delta,
          max: delta,
          count: delta,
          sourceList: "wizard",
          constraints: {
            maxLevel: getThirdCasterMax(levelVal),
            school_in: anySchoolLevels.has(levelVal) ? [] : ["enchantment", "illusion"],
            enforceSchoolOptions: !anySchoolLevels.has(levelVal)
          },
          notes: anySchoolLevels.has(levelVal)
            ? "These spells can be from any school of magic."
            : "These spells must be from the enchantment or illusion schools."
        });
      }
      plan.choices.push({
        id: "choice:arcane-trickster:spell-swap",
        type: "spell_swap",
        prompt: "Replace one Arcane Trickster spell (optional)",
        min: 0,
        max: 1,
        sourceList: "wizard",
        progression: "third",
        constraints: {
          school_in: ["enchantment", "illusion"]
        },
        allowAnySchoolIfReplacingNonSchool: true,
        notes: "If you replace a spell gained from any school, the replacement can be from any school."
      });
    }

    const classChoices = classEntry?.choices || {};
    const hasPickedSubclass = !!String(subclassName || "").trim();
    if ((classChoices?.specialistFeatures?.levels || []).includes(levelVal) && !hasPickedSubclass) {
      plan.choices.push({
        id: "choice:artificer:specialist-feature",
        type: "note",
        prompt: "Record your specialist feature choice",
        min: 0,
        max: 1,
        allowCustom: true
      });
    }

    const infusionDelta = getInfusionDelta(classEntry, Number(character?.level) || 1, levelVal);
    if (infusionDelta > 0) {
      const options = await loadInfusionsAvailable(levelVal);
      plan.choices.push({
        id: "choice:artificer:infusions",
        type: "infusion",
        prompt: `Choose ${infusionDelta} infusion(s)`,
        min: infusionDelta,
        max: infusionDelta,
        options
      });
    }

    const classChoicesAtLevel = normalizeEntryChoicesAtLevel(classEntry, levelVal);
    for (const choice of classChoicesAtLevel) {
      if (!choice) continue;
      const count = Number(choice?.count || choice?.choose || 1) || 1;
      const notes = choice?.notes || choice?.desc || "";
      const isConditional = /only if|if your|if you/i.test(notes);
      const id = `choice:class:${String(clsName || "").toLowerCase().replace(/\\s+/g, '-')}:${choice?.id || choice?.name || "choice"}`;
      if (plan.choices.some(c => c.id === id)) continue;
      let options = normalizeChoiceOptions(choice?.options || []);
      options = expandChoiceOptionsForPlan(choice, options, character);
      const choiceIdLower = String(choice?.id || "").toLowerCase();
      const choiceNameLower = String(choice?.name || "").toLowerCase();
      const isFavoredEnemyChoice = choiceIdLower.includes("favored_enemy") || choiceNameLower.includes("favored enemy");
      const isFavoredTerrainChoice = choiceIdLower.includes("favored_terrain") || choiceNameLower.includes("favored terrain");
      if (isFavoredEnemyChoice) {
        const picked = new Set(
          getChoiceValuesFromHistory(character, "favored_enemy")
            .concat(getTraitChosenValues(character, "favored enemy"))
            .map(v => normalizeFavoredOption(v, "enemy"))
        );
        options = options.filter(o => !picked.has(normalizeFavoredOption(String(o?.value || o?.label || "").trim(), "enemy")));
      }
      if (isFavoredTerrainChoice) {
        const picked = new Set(
          getChoiceValuesFromHistory(character, "favored_terrain")
            .concat(getTraitChosenValues(character, "natural explorer"))
            .map(v => normalizeFavoredOption(v, "terrain"))
        );
        options = options.filter(o => !picked.has(normalizeFavoredOption(String(o?.value || o?.label || "").trim(), "terrain")));
      }
      plan.choices.push({
        id,
        type: choice?.type || "class-choice",
        prompt: choice?.name || "Class choice",
        min: isConditional ? 0 : count,
        max: count,
        options,
        notes
      });
    }

    const derivedClassChoices = deriveChoicesFromFeatures(plan.classFeatures, `choice:class:${slugify(clsName) || "class"}:feature`);
    for (const d of derivedClassChoices) {
      if (!plan.choices.some(c => String(c?.prompt || c?.name || "").toLowerCase() === String(d.prompt).toLowerCase())) {
        plan.choices.push(d);
      }
    }

    const subclassChoices = getSubclassChoicesAtLevel(subclassEntry, levelVal, subclassName);
    for (const choice of subclassChoices) {
      const count = Number(choice?.count || choice?.choose || 1) || 1;
      const notes = choice?.notes || choice?.desc || "";
      const isConditional = /only if|if your|if you/i.test(notes);
      const options = expandChoiceOptionsForPlan(choice, normalizeChoiceOptions(choice?.options || []), character);
      const isCavalierEitherOr = isCavalierBonusSkillOrLanguageChoice(choice, subclassName);
      plan.choices.push({
        id: ensureChoiceId(`choice:subclass:${String(subclassName || "").toLowerCase().replace(/\\s+/g, '-')}`, choice),
        type: choice?.type || "subclass-choice",
        prompt: choice?.prompt || choice?.name || "Subclass choice",
        min: isConditional ? 0 : (isCavalierEitherOr ? 0 : count),
        max: count,
        options,
        notes
      });
    }

    // Feat replacement rules that trigger on level-up (e.g., Eldritch Adept invocation swap).
    const replacementRules = Array.isArray(character?.replacementRules) ? character.replacementRules : [];
    const featChoiceRows = Array.isArray(character?.choices?.featChoices) ? character.choices.featChoices : [];
    for (const rule of replacementRules) {
      if (String(rule?.replace_on || "").toLowerCase() !== "level_up") continue;
      const rep = rule?.replaces || {};
      if (String(rep?.type || "").toLowerCase() !== "eldritch_invocation") continue;
      const sourceChoiceId = String(rep?.source_choice || "").trim();
      if (!sourceChoiceId) continue;
      const featRow = featChoiceRows.find(r => String(r?.featId || "").toLowerCase() === String(rule?.source || "").toLowerCase());
      const currentInvocation = String((featRow?.choices?.[sourceChoiceId] || [])[0] || "").trim();
      if (!currentInvocation) continue;
      plan.choices.push({
        id: `choice:feat-replacement:${slugify(rule?.id || sourceChoiceId || "eldritch-invocation")}`,
        type: "invocation_swap",
        prompt: "Eldritch Adept: replace invocation (optional)",
        min: 0,
        max: 1,
        sourceList: "warlock",
        fromOptions: [currentInvocation],
        notes: String(rule?.prompt || "On level up, you may replace the invocation chosen with Eldritch Adept."),
        constraints: { ...(rule?.constraints || {}) },
        replacementRule: {
          id: String(rule?.id || ""),
          sourceFeatId: String(rule?.source || ""),
          sourceChoiceId
        }
      });
    }

    return plan;
  }

  async function resolveLevelOptions(character, level) {
    const clsName = character?.class || "";
    const subclassName = window.pickSubclassName ? window.pickSubclassName(character) : "";
    const classes = (await window.loadClassesLocal?.()) || [];
    const subclasses = (await window.loadSubclassesLocal?.()) || [];

    const classEntry = classes.find(c => String(c.name || "").toLowerCase() === String(clsName).toLowerCase());
    const subclassEntry = subclasses.find(s =>
      String(s.name || "").toLowerCase() === String(subclassName).toLowerCase() &&
      String(s.class || "").toLowerCase() === String(clsName).toLowerCase()
    );

    const classFeatures = normalizeFeaturesAtLevel(classEntry, level);
    const subclassFeatures = normalizeFeaturesAtLevel(subclassEntry, level);
    const classActions = normalizeActionsAtLevel(classEntry, level);
    const subclassActions = normalizeActionsAtLevel(subclassEntry, level);
    const subclassSpells = normalizeSubclassSpellsAtLevel(subclassEntry, level);

    return {
      classFeatures,
      subclassFeatures,
      classActions,
      subclassActions,
      subclassSpells,
      classEntry,
      subclassEntry,
      subclasses
    };
  }

  function hasASIAtLevel(level, classFeatures, classEntry) {
    const fromChoices = classEntry?.choices?.asi?.levels || [];
    if (fromChoices.includes(level)) return true;
    if ([4, 8, 12, 16, 19].includes(level)) return true;
    return (classFeatures || []).some(f => /ability score|ability score improvement|ability score increase/i.test(f.name || ""));
  }

  function getInfusionDelta(classEntry, oldLevel, newLevel) {
    const prog = classEntry?.progression || {};
    const prev = prog[String(oldLevel)]?.infusionsKnown ?? null;
    const next = prog[String(newLevel)]?.infusionsKnown ?? null;
    if (typeof prev === "number" && typeof next === "number") {
      return Math.max(0, next - prev);
    }
    return 0;
  }

  async function loadInfusionsAvailable(maxLevel) {
    const list = await window.loadInfusions?.([]) || [];
    return (list || [])
      .filter(i => (Number(i.level) || 0) <= maxLevel)
      .map(i => ({ name: i.name, desc: i.desc || "" }));
  }

  async function refreshFileStatus() {
    const status = document.getElementById("lu-file-status");
    if (!status) return;
    if (typeof window.getDataDirectoryHandle !== "function") {
      status.textContent = "File save: unsupported in this browser";
      return;
    }
    const handle = await window.getDataDirectoryHandle({ prompt: false });
    status.textContent = handle ? "File save: linked to data folder" : "File save: not linked";
  }

  function setError(message) {
    const box = document.getElementById("lu-error");
    if (!box) return;
    box.textContent = message || "";
    setVisibility(box, !!message);
  }

  function buildAbilityOptions() {
    const abilities = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
    return ['<option value="">--</option>']
      .concat(abilities.map(a => `<option value="${a}">${a}</option>`))
      .join("");
  }

  async function getDruidCantripOptions() {
    if (typeof window.loadSpells !== "function") return [];
    const spells = await window.loadSpells();
    const list = Array.isArray(spells) ? spells : Object.values(spells || {});
    return list
      .filter(s => Number(s.level ?? s.level_int ?? 0) === 0)
      .filter(s => Array.isArray(s.classes) && s.classes.some(c => String(c).toLowerCase() === "druid"))
      .map(s => String(s.name || ""))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }

  let _spellListCache = null;
  async function loadSpellList() {
    if (_spellListCache) return _spellListCache;
    let list = [];
    try {
      const root = (document.querySelector('meta[name="data-root"]')?.content?.trim()) || './data/';
      const res = await fetch(`${root.replace(/\/+$/, '')}/spells.json`, { cache: 'no-store' });
      if (res.ok) {
        const spells = await res.json();
        list = Array.isArray(spells) ? spells : Object.values(spells || {});
      }
    } catch (_) {}
    if (!list.length && typeof window.loadSpells === "function") {
      const spells = await window.loadSpells();
      list = Array.isArray(spells) ? spells : Object.values(spells || {});
    }
    _spellListCache = list;
    return list;
  }

  function getSpellSchool(spell) {
    const raw = spell?.school?.index || spell?.school?.name || spell?.school || "";
    return String(raw).toLowerCase();
  }

  function spellMatchesClass(spell, className) {
    const target = String(className || "").toLowerCase();
    if (!target || target === "any") return true;
    const list = Array.isArray(spell?.classes) ? spell.classes : [];
    return list.some(c => String(c).toLowerCase() === target);
  }

  function getSpellSourceLabel(character, spellName) {
    const map = character?.spellSources || {};
    const target = String(spellName || "").toLowerCase();
    for (const [k, v] of Object.entries(map)) {
      if (String(k || "").toLowerCase() === target) return String(v || "").toLowerCase();
    }
    return "";
  }

  async function getSpellOptionsForChoice(choice, levelVal, current) {
    const list = await loadSpellList();
    const source = String(choice?.sourceList || choice?.list || "").toLowerCase();
    const type = String(choice?.type || "").toLowerCase();
    const constraints = choice?.constraints || {};
    const schoolIn = Array.isArray(constraints.school_in) ? constraints.school_in.map(s => String(s).toLowerCase()) : [];
    const minSchoolCount = Number(constraints.minSchoolCount || 0);
    const enforceSchoolOptions = !!constraints.enforceSchoolOptions;
    const excludeKnown = !!constraints.excludeKnown;
    const known = new Set((current?.spells || []).map(s => String(s || "").toLowerCase()));
    const levelExact = Number.isFinite(Number(constraints.level)) ? Number(constraints.level) : null;
    const maxLevel = Number.isFinite(Number(constraints.maxLevel)) ? Number(constraints.maxLevel) : null;
    const targetLevel = type === "cantrip" ? 0 : (levelExact != null ? levelExact : null);

    return list
      .filter(s => spellMatchesClass(s, source))
      .filter(s => targetLevel == null || Number(s.level ?? s.level_int ?? 0) === targetLevel)
      .filter(s => maxLevel == null || Number(s.level ?? s.level_int ?? 0) <= maxLevel)
      .filter(s => {
        if (!schoolIn.length) return true;
        if (minSchoolCount && !enforceSchoolOptions) return true;
        return schoolIn.includes(getSpellSchool(s));
      })
      .filter(s => !excludeKnown || !known.has(String(s?.name || "").toLowerCase()))
      .map(s => String(s.name || ""))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }

  function getThirdCasterMax(level) {
    if (level <= 2) return 0;
    if (level <= 6) return 1;
    if (level <= 12) return 2;
    if (level <= 18) return 3;
    return 4;
  }

  function arcaneTricksterSpellsKnown(level) {
    const L = Number(level) || 1;
    const knownMap = {
      1: 0, 2: 0, 3: 3, 4: 4, 5: 4, 6: 4, 7: 5, 8: 6, 9: 6, 10: 7,
      11: 8, 12: 8, 13: 9, 14: 10, 15: 10, 16: 11, 17: 11, 18: 12, 19: 13, 20: 14
    };
    return knownMap[L] || 0;
  }

  function rangerSpellsKnown(level) {
    const L = Number(level) || 1;
    const knownMap = {
      1: 0, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6,
      11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11
    };
    return knownMap[L] || 0;
  }

  async function loadFeats() {
    try {
      const res = await fetch("data/feats.json");
      if (!res.ok) return [];
      const feats = await res.json();
      return Array.isArray(feats) ? feats : [];
    } catch (err) {
      console.warn("Failed to load feats.json", err);
      return [];
    }
  }

  async function loadManeuvers() {
    try {
      const res = await fetch("data/maneuvers.json");
      if (!res.ok) return [];
      const maneuvers = await res.json();
      return Array.isArray(maneuvers) ? maneuvers : [];
    } catch (err) {
      console.warn("Failed to load maneuvers.json", err);
      return [];
    }
  }

  async function loadTools() {
    try {
      let list = [];
      if (typeof window.loadEquipmentLocal === "function") {
        const catalog = await window.loadEquipmentLocal();
        list = Array.isArray(catalog?.equipment) ? catalog.equipment : [];
      } else {
        const res = await fetch("data/equipment.json");
        if (!res.ok) return [];
        const items = await res.json();
        list = Array.isArray(items) ? items : [];
      }
      return list
        .filter(i => {
          const cat = String(i?.equipment_category?.name || i?.equipment_category?.index || i?.category?.name || i?.category?.id || "").toLowerCase();
          return cat === "tools" || i?.tool;
        })
        .map(i => String(i?.name || ""))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    } catch (err) {
      console.warn("Failed to load equipment.json for tools", err);
      return [];
    }
  }

  async function loadWeapons() {
    try {
      let list = [];
      if (typeof window.loadEquipmentLocal === "function") {
        const catalog = await window.loadEquipmentLocal();
        list = Array.isArray(catalog?.equipment) ? catalog.equipment : [];
      } else {
        const res = await fetch("data/equipment.json");
        if (!res.ok) return [];
        const items = await res.json();
        list = Array.isArray(items) ? items : [];
      }
      return list
        .filter(i => {
          const cat = String(i?.equipment_category?.name || i?.equipment_category?.index || i?.category?.name || i?.category?.id || "").toLowerCase();
          return cat === "weapon" || i?.weapon;
        })
        .map(i => String(i?.name || ""))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    } catch (err) {
      console.warn("Failed to load equipment.json for weapons", err);
      return [];
    }
  }

  const SKILL_LIST = [
    "Acrobatics",
    "Animal Handling",
    "Arcana",
    "Athletics",
    "Deception",
    "History",
    "Insight",
    "Intimidation",
    "Investigation",
    "Medicine",
    "Nature",
    "Perception",
    "Performance",
    "Persuasion",
    "Religion",
    "Sleight of Hand",
    "Stealth",
    "Survival"
  ];
  const BARBARIAN_SKILL_OPTIONS = [
    "Animal Handling",
    "Athletics",
    "Intimidation",
    "Nature",
    "Perception",
    "Survival"
  ];

  const LANGUAGE_LIST = [
    "Common",
    "Dwarvish",
    "Elvish",
    "Giant",
    "Gnomish",
    "Goblin",
    "Halfling",
    "Orc",
    "Abyssal",
    "Celestial",
    "Draconic",
    "Deep Speech",
    "Infernal",
    "Primordial",
    "Sylvan",
    "Undercommon"
  ];

  function isSkillName(value) {
    return SKILL_LIST.some(s => s.toLowerCase() === String(value || "").toLowerCase());
  }

  function getKnownSkills(character) {
    const out = new Set();
    const prof = Array.isArray(character?.proficiencies?.skills) ? character.proficiencies.skills : [];
    const legacy = Array.isArray(character?.skill_proficiencies?.skills) ? character.skill_proficiencies.skills : [];
    for (const skill of [...prof, ...legacy]) {
      const raw = String(skill || "").trim();
      if (!raw) continue;
      const canonical = SKILL_LIST.find(s => s.toLowerCase() === raw.toLowerCase()) || raw;
      out.add(String(canonical).toLowerCase());
    }
    return out;
  }

  function getCarriedWeaponOptions(character) {
    const out = new Set();
    const add = (name) => {
      const v = String(name || "").trim();
      if (v) out.add(v);
    };
    const equipped = Array.isArray(character?.equipment?.weapons) ? character.equipment.weapons : [];
    equipped.forEach(add);
    const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
    gear.forEach(item => {
      if (!item || typeof item !== "object") return;
      const slot = String(item.equip_slot || "").toLowerCase();
      if (slot === "weapon" || item.weapon) add(item.name);
    });
    return Array.from(out).sort((a, b) => a.localeCompare(b));
  }

  async function loadInvocations() {
    try {
      const res = await fetch("data/eldritch_invocations.json");
      if (!res.ok) return [];
      const invocations = await res.json();
      return Array.isArray(invocations) ? invocations : [];
    } catch (err) {
      console.warn("Failed to load eldritch_invocations.json", err);
      return [];
    }
  }

  function normalizeFeatSource(source) {
    if (source == null) return "";
    const raw = (typeof source === "object")
      ? String(source.book || source.name || source.source || "")
      : String(source || "");
    if (!raw) return "";
    const map = {
      "PHB": "PHB",
      "TCoE": "TCoE",
      "XGtE": "XGtE",
      "SCAG": "SCAG",
      "Player's Handbook": "PHB",
      "Tasha's Cauldron of Everything": "TCoE",
      "Xanathar's Guide to Everything": "XGtE",
      "Sword Coast Adventurer's Guide": "SCAG"
    };
    return map[raw] || raw;
  }

  window.getLevelUpDecisionPlan = buildLevelUpDecisionPlan;

  async function openLevelUpModal(current, filename) {
    const oldLevel = Number(current.level) || 1;
    const hitDie = current.hit_die || "d8";
    const conMod = getConMod(current);
    const backdrop = ensureBackdrop();
    const modal = ensureModal();

    const nameEl = modal.querySelector("#lu-character-name");
    const metaEl = modal.querySelector("#lu-character-meta");
    if (nameEl) nameEl.textContent = current.name || "Character";
    if (metaEl) metaEl.textContent = `${current.class || "Class"} ${oldLevel}`;

    const newLevelInput = modal.querySelector("#lu-new-level");
    const levelHint = modal.querySelector("#lu-level-hint");
    if (newLevelInput) {
      newLevelInput.value = String(oldLevel + 1);
      newLevelInput.min = String(oldLevel + 1);
    }
    if (levelHint) {
      levelHint.textContent = "Level up one level at a time.";
    }

    const hpInput = modal.querySelector("#lu-hp-gain");
    const hpHint = modal.querySelector("#lu-hp-hint");
    if (hpInput) hpInput.value = "";
    if (hpHint) {
      hpHint.textContent = `Hit die: ${hitDie}. Roll ${hitDie} + CON mod (${fmtMod(current?.abilities?.CON)}).`;
    }

    const asiSection = modal.querySelector("#lu-asi-section");
    const asiFields = modal.querySelector("#lu-asi-fields");
    const featFields = modal.querySelector("#lu-feat-fields");
    const asi1 = modal.querySelector("#lu-asi-1");
    const asi2 = modal.querySelector("#lu-asi-2");
    const asiDouble = modal.querySelector("#lu-asi-double");
    const featName = modal.querySelector("#lu-feat-name");
    const featNotes = modal.querySelector("#lu-feat-notes");
    const featDesc = modal.querySelector("#lu-feat-desc");
    const featChoicesWrap = modal.querySelector("#lu-feat-choices");
    const choicesSection = modal.querySelector("#lu-choices-section");
    const dynamicChoices = modal.querySelector("#lu-dynamic-choices");
    const specialistChoice = modal.querySelector("#lu-specialist-choice");
    const specialistSelect = modal.querySelector("#lu-specialist-select");
    const specialistFeature = modal.querySelector("#lu-specialist-feature");
    const specialistNotes = modal.querySelector("#lu-specialist-notes");
    const infusionsChoice = modal.querySelector("#lu-infusions-choice");
    const infusionsHint = modal.querySelector("#lu-infusions-hint");
    const infusionsList = modal.querySelector("#lu-infusions-list");
    const newLevel = oldLevel + 1;
    let lastOptions = null;
    const applyLevelOptions = async () => {
      const levelVal = Number(newLevelInput?.value || newLevel);
      const opts = await resolveLevelOptions(current, levelVal);
      const decisionPlan = await buildLevelUpDecisionPlan(current, levelVal, opts);
      lastOptions = { ...opts, decisionPlan };
      const isAsi = hasASIAtLevel(levelVal, opts.classFeatures, opts.classEntry);
      setVisibility(asiSection, isAsi);

      setList(modal.querySelector("#lu-class-features"), opts.classFeatures);
      setList(modal.querySelector("#lu-subclass-features"), opts.subclassFeatures);
      setList(modal.querySelector("#lu-class-actions"), opts.classActions);
      setList(modal.querySelector("#lu-subclass-actions"), opts.subclassActions);
      renderGrantedSpellList(modal.querySelector("#lu-subclass-spells"), opts.subclassSpells);

      const showChoices = (decisionPlan.choices || []).length > 0;
      setVisibility(choicesSection, showChoices);

      await renderDecisionChoices(dynamicChoices, decisionPlan, current);

      const hasDynamicSpecialist = (decisionPlan.choices || []).some(c =>
        c.type === "specialist" || c.type === "subclass" || c.type === "note"
      );
      const hasDynamicInfusions = (decisionPlan.choices || []).some(c => c.type === "infusion");
      setVisibility(specialistChoice, !hasDynamicSpecialist);
      setVisibility(specialistFeature, !hasDynamicSpecialist);
      setVisibility(infusionsChoice, !hasDynamicInfusions);

      if (!hasDynamicSpecialist) {
        const classChoices = opts.classEntry?.choices || {};
        const hasSpecialistChoice = Number(classChoices?.specialistChoice?.level) === levelVal;
        setVisibility(specialistChoice, hasSpecialistChoice);
        if (hasSpecialistChoice && specialistSelect) {
          const options = classChoices.specialistChoice?.options || [];
          specialistSelect.innerHTML = ['<option value="">-- choose --</option>']
            .concat(options.map(o => `<option value="${o}">${o}</option>`))
            .join("");
          specialistSelect.value = "";
        }

        const hasSpecialistFeature = (classChoices?.specialistFeatures?.levels || []).includes(levelVal)
          && !String(pickSubclassNameSafe(current) || "").trim();
        setVisibility(specialistFeature, hasSpecialistFeature);
        if (specialistNotes) specialistNotes.value = "";
      }

      if (!hasDynamicInfusions) {
        const infusionDelta = getInfusionDelta(opts.classEntry, oldLevel, levelVal);
        setVisibility(infusionsChoice, infusionDelta > 0);
        if (infusionsChoice && infusionDelta > 0) {
          const available = await loadInfusionsAvailable(levelVal);
          const known = (current.infusions?.known || []).map(s => String(s).toLowerCase());
          const requiredTotal = known.length + infusionDelta;
          if (infusionsHint) {
            infusionsHint.textContent = `Pick ${infusionDelta} new infusion(s). Total known after level-up: ${requiredTotal}.`;
          }
          if (infusionsList) {
            infusionsList.innerHTML = "";
            for (const entry of available) {
              const isKnown = known.includes(String(entry.name).toLowerCase());
              const row = document.createElement("label");
              row.className = "lu-check";
              row.innerHTML = `
                <input type="checkbox" data-name="${entry.name}" ${isKnown ? "checked disabled" : ""}>
                <span>${entry.name}</span>
              `;
              infusionsList.appendChild(row);
            }
          }
        }
      }
    };

    try {
      await applyLevelOptions();
    } catch (err) {
      console.error("[LevelUp] Failed to initialize level options:", err);
      setError("Could not load level-up options. Check console for details.");
    }
    if (newLevelInput) {
      newLevelInput.onchange = () => { applyLevelOptions(); };
    }

    if (asi1 && asi2) {
      const opts = buildAbilityOptions();
      asi1.innerHTML = opts;
      asi2.innerHTML = opts;
    }
    if (asiDouble) {
      asiDouble.checked = false;
    }
    if (featName) featName.value = "";
    if (featNotes) featNotes.value = "";
    if (featDesc) featDesc.textContent = "";
    if (featChoicesWrap) featChoicesWrap.innerHTML = "";
    if (featDesc) featDesc.textContent = "";

    const notes = modal.querySelector("#lu-notes");
    if (notes) notes.value = "";

    const onModeChange = () => {
      const mode = readRadio("lu-asi-mode");
      setVisibility(asiFields, mode === "asi");
      setVisibility(featFields, mode === "feat");
    };
    modal.querySelectorAll('input[name="lu-asi-mode"]').forEach(input => {
      input.onchange = onModeChange;
    });
    onModeChange();

    let featsIndex = [];
    const countFeatTaken = (characterLike, featDef) => {
      const feats = Array.isArray(characterLike?.feats) ? characterLike.feats : [];
      const featId = String(featDef?.id || "").toLowerCase();
      const featName = String(featDef?.name || "").toLowerCase();
      return feats.filter(f => {
        const id = String((f && typeof f === "object" ? f.id : "") || "").toLowerCase();
        const name = String((f && typeof f === "object" ? f.name : f) || "").toLowerCase();
        return (featId && id === featId) || (!featId && featName && name === featName) || (featName && name === featName);
      }).length;
    };
    const canTakeFeatNow = (characterLike, featDef) => {
      const timesTaken = countFeatTaken(characterLike, featDef);
      if (!timesTaken) return true;
      const rep = featDef?.repeatable;
      if (!rep) return false;
      if (typeof rep === "object") {
        const maxTimes = Number(rep.max_times || 0);
        if (maxTimes > 0 && timesTaken >= maxTimes) return false;
      }
      return true;
    };
    const summarizeFeatForUi = (featDef) => {
      const raw = String(featDef?.desc || "").trim();
      if (raw) return raw;
      const name = String(featDef?.name || "").trim().toLowerCase();
      if (name === "resilient") {
        return "Increase one ability score by 1 (to a maximum of 20), and gain proficiency in saving throws using that ability.";
      }
      const effects = Array.isArray(featDef?.effects) ? featDef.effects : [];
      const parts = [];
      if (effects.some(e => e?.type === "ability_score_bonus")) parts.push("Includes an ability score increase.");
      if (effects.some(e => e?.type === "saving_throw_proficiency")) parts.push("Grants a saving throw proficiency.");
      if (effects.some(e => e?.type === "skill_proficiency")) parts.push("Grants a skill proficiency.");
      if (effects.some(e => e?.type === "tool_proficiency")) parts.push("Grants a tool proficiency.");
      if (effects.some(e => e?.type === "spell_grant")) parts.push("Grants spell access.");
      if (effects.some(e => e?.type === "hp_max_bonus")) parts.push("Increases your hit point maximum.");
      return parts.join(" ");
    };
    if (featName) {
      const feats = await loadFeats();
      featsIndex = feats;
      const options = feats
        .filter(f => canTakeFeatNow(current, f))
        .map(f => ({
          name: String(f?.name || ""),
          desc: summarizeFeatForUi(f),
          source: normalizeFeatSource(f?.source || "")
        }))
        .filter(f => f.name)
        .sort((a, b) => a.name.localeCompare(b.name));
      featName.innerHTML = ['<option value="">-- choose feat --</option>']
        .concat(options.map(f => {
          const suffix = f.source ? ` (${f.source})` : "";
          return `<option value="${f.name}">${f.name}${suffix}</option>`;
        }))
        .join("");

      const buildFeatChoiceBlock = (choice, choicesState) => {
        const block = document.createElement("div");
        block.className = "lu-choice-block";
        block.dataset.choiceId = choice.id || "";
        block.dataset.choiceType = "feat-choice";
        const label = document.createElement("label");
        label.className = "lu-label";
        label.textContent = choice.prompt || "Feat choice";
        block.appendChild(label);
        const count = Number(choice.count || choice.choose || 1) || 1;
        const opts = choicesState.options || [];
        if (opts.length) {
          for (let i = 0; i < count; i++) {
            const select = document.createElement("select");
            select.dataset.choiceId = choice.id || "";
            select.innerHTML = ['<option value="">-- choose --</option>']
              .concat(opts.map(o => `<option value="${o}">${o}</option>`))
              .join("");
            if (choicesState.values?.[i]) select.value = choicesState.values[i];
            block.appendChild(select);
          }
        } else {
          for (let i = 0; i < count; i++) {
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Enter choice";
            input.dataset.choiceId = choice.id || "";
            input.className = "lu-custom-input";
            if (choicesState.values?.[i]) input.value = choicesState.values[i];
            block.appendChild(input);
          }
        }
        if (choice.notes) {
          const hint = document.createElement("div");
          hint.className = "lu-hint";
          hint.textContent = choice.notes;
          block.appendChild(hint);
        }
        return block;
      };

      const readFeatChoiceSelections = () => {
        const selections = {};
        if (!featChoicesWrap) return selections;
        featChoicesWrap.querySelectorAll(".lu-choice-block").forEach(block => {
          const choiceId = block.dataset.choiceId;
          if (!choiceId) return;
          const values = [];
          block.querySelectorAll("select[data-choice-id]").forEach(sel => {
            if (sel.value) values.push(sel.value);
          });
          block.querySelectorAll("input[data-choice-id]").forEach(input => {
            if (input.value) values.push(input.value);
          });
          selections[choiceId] = values;
        });
        return selections;
      };

      const resolveFeatChoiceOptions = async (choice, selectionsMap) => {
        const selector = choice?.selector || {};
        const hasAttackRoll = (spell) => {
          const text = String(spell?.description || spell?.desc || "").toLowerCase();
          return text.includes("spell attack");
        };
        if (selector.type === "from_list") return selector.options || [];
        if (selector.type === "spell_from_class_list") {
          const className = selector.class || selectionsMap[selector.class_from_choice]?.[0] || "";
          if (!className) return [];
          const spells = await window.loadSpells?.();
          const list = Array.isArray(spells) ? spells : Object.values(spells || {});
          return list
            .filter(s => Number(s.level ?? s.level_int ?? 0) === Number(selector.level ?? 0))
            .filter(s => Array.isArray(s.classes) && s.classes.some(c => String(c).toLowerCase() === String(className).toLowerCase()))
            .filter(s => !selector.ritual_only || !!s.ritual)
            .filter(s => !selector.requires_attack_roll || hasAttackRoll(s))
            .map(s => String(s.name || ""))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
        }
        if (selector.type === "from_index" && selector.index === "spells") {
          const spells = await window.loadSpells?.();
          const list = Array.isArray(spells) ? spells : Object.values(spells || {});
          const where = selector.where || {};
          return list
            .filter(s => (where.level == null || Number(s.level ?? s.level_int ?? 0) === Number(where.level)))
            .filter(s => {
              if (!Array.isArray(where.school_in) || !where.school_in.length) return true;
              return where.school_in.map(w => String(w).toLowerCase()).includes(getSpellSchool(s));
            })
            .filter(s => !selector.ritual_only || !!s.ritual)
            .filter(s => !selector.requires_attack_roll || hasAttackRoll(s))
            .map(s => String(s.name || ""))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
        }
        if (selector.type === "from_index" && selector.index === "maneuvers") {
          const maneuvers = await loadManeuvers();
          return maneuvers
            .map(m => String(m?.name || ""))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
        }
        if (selector.type === "from_index" && selector.index === "skills") {
          return SKILL_LIST.slice();
        }
        if (selector.type === "from_index" && selector.index === "languages") {
          return LANGUAGE_LIST.slice();
        }
        if (selector.type === "from_index" && selector.index === "tools") {
          return await loadTools();
        }
        if (selector.type === "from_index" && selector.index === "weapons") {
          return await loadWeapons();
        }
        if (selector.type === "from_index" && selector.index === "skills_and_tools") {
          const tools = await loadTools();
          return SKILL_LIST.concat(tools).sort((a, b) => a.localeCompare(b));
        }
        if (selector.type === "from_index" && selector.index === "eldritch_invocations") {
          const invocations = await loadInvocations();
          const constraints = choice?.constraints || {};
          const levelForChoice = Number(newLevelInput?.value || current?.level || 1) || 1;
          const enforcePrereqs = !!constraints.must_meet_invocation_prerequisites;
          const nonWarlockNoPrereq = !!constraints.non_warlock_cannot_choose_prereq_invocations;
          const filtered = invocations.filter(inv => {
            const prereqs = Array.isArray(inv?.prerequisites) ? inv.prerequisites : [];
            if (nonWarlockNoPrereq && !isWarlockCharacter(current) && prereqs.length > 0) return false;
            if (enforcePrereqs && !meetsInvocationPrereqs(inv, levelForChoice, current)) return false;
            return true;
          });
          return filtered
            .map(i => String(i?.name || ""))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
        }
        return [];
      };

      const renderFeatChoices = async () => {
        if (!featChoicesWrap) return;
        const selected = featName.value;
        const featDef = featsIndex.find(f => String(f?.name || "") === String(selected));
        const selectionsMap = readFeatChoiceSelections();
        featChoicesWrap.innerHTML = "";
        if (!featDef || !Array.isArray(featDef.choices) || !featDef.choices.length) return;
        for (const choice of featDef.choices) {
          const options = await resolveFeatChoiceOptions(choice, selectionsMap);
          const state = { options, values: selectionsMap[choice.id] || [] };
          const block = buildFeatChoiceBlock(choice, state);
          featChoicesWrap.appendChild(block);
        }
        featChoicesWrap.querySelectorAll("select[data-choice-id]").forEach(sel => {
          sel.addEventListener("change", renderFeatChoices);
        });
      };

      const syncFeatDesc = () => {
        const selected = featName.value;
        const hit = options.find(f => f.name === selected);
        if (featDesc) featDesc.textContent = hit?.desc || "";
        if (featNotes) {
          const auto = featNotes.dataset.autoFilled === "1";
          if ((!featNotes.value || auto) && (hit?.desc || "")) {
            featNotes.value = hit.desc;
            featNotes.dataset.autoFilled = "1";
          }
        }
        renderFeatChoices();
      };
      featName.addEventListener("change", syncFeatDesc);
      if (featNotes) {
        featNotes.addEventListener("input", () => {
          featNotes.dataset.autoFilled = "0";
        });
      }
      syncFeatDesc();
    }

    const onDoubleChange = () => {
      if (!asiDouble || !asi2) return;
      if (asiDouble.checked) {
        asi2.value = asi1?.value || "";
        asi2.disabled = true;
      } else {
        asi2.disabled = false;
      }
    };
    if (asiDouble) {
      asiDouble.onchange = onDoubleChange;
    }
    if (asi1) {
      asi1.onchange = () => {
        if (asiDouble?.checked && asi2) {
          asi2.value = asi1.value;
        }
      };
    }

    setError("");
    refreshFileStatus();

    const close = () => {
      backdrop.classList.add("hidden");
      modal.classList.add("hidden");
    };

    const cancelBtn = modal.querySelector("#lu-cancel");
    if (cancelBtn) cancelBtn.onclick = close;
    backdrop.onclick = close;

    const pickBtn = modal.querySelector("#lu-pick-dir");
    if (pickBtn) {
      pickBtn.onclick = async () => {
        if (typeof window.getDataDirectoryHandle !== "function") {
          setError("This browser does not support direct file writes.");
          return;
        }
        const handle = await window.getDataDirectoryHandle({ prompt: true });
        if (!handle) {
          setError("Could not access the data folder. Please try again.");
        } else {
          setError("");
        }
        refreshFileStatus();
      };
    }

    const applyBtn = modal.querySelector("#lu-apply");
    if (applyBtn) {
      applyBtn.onclick = async () => {
        setError("");
        const rawLevel = Number(newLevelInput?.value);
        if (!Number.isInteger(rawLevel) || rawLevel <= oldLevel) {
          setError("New level must be higher than current level.");
          return;
        }
        if (rawLevel !== oldLevel + 1) {
          setError("Please level up one level at a time.");
          return;
        }

        const hpGain = Number(hpInput?.value || 0);
        if (!Number.isFinite(hpGain) || hpGain < 0) {
          setError("HP gained must be a non-negative number.");
          return;
        }
        const applyHpToCurrent = !!modal.querySelector("#lu-hp-current")?.checked;

        const updated = structuredClone(current);
        updated.level = rawLevel;

        // Barbarian 20: Primal Champion (+4 STR/+4 CON, maxima become 24).
        const classNameLower = String(updated.class || current?.class || "").trim().toLowerCase();
        if (classNameLower === "barbarian" && oldLevel < 20 && rawLevel >= 20) {
          updated.abilityCaps = { ...(updated.abilityCaps || {}) };
          updated.abilityCaps.STR = Math.max(Number(updated.abilityCaps.STR || 20), 24);
          updated.abilityCaps.CON = Math.max(Number(updated.abilityCaps.CON || 20), 24);
          const abilities = { ...(updated.abilities || {}) };
          const boostTo24 = (abilityKey) => {
            const currentScore = Number(abilities[abilityKey]) || 0;
            abilities[abilityKey] = Math.min(currentScore + 4, 24);
          };
          boostTo24("STR");
          boostTo24("CON");
          updated.abilities = abilities;
        }

        const decisionPlan = lastOptions?.decisionPlan || null;
        const decisionSelections = readDecisionSelections(dynamicChoices);
        const decisionErrors = await validateDecisionSelections(decisionPlan, decisionSelections);
        if (decisionErrors.length) {
          setError(decisionErrors[0]);
          return;
        }
        const decisionGrants = collectChoiceGrants(decisionPlan, decisionSelections);

        if (hpGain > 0) {
          const baseMax = Number(updated.maxHP) || 0;
          updated.maxHP = baseMax + hpGain;
          if (applyHpToCurrent) {
            const baseCurrent = Number(updated.currentHP) || 0;
            updated.currentHP = Math.min(updated.maxHP, baseCurrent + hpGain);
          }
        }

        // Apply per-level max HP bonuses from already-owned feats once each level-up.
        const existingPerLevelHpBonus = (() => {
          if (!Array.isArray(updated.feats) || !Array.isArray(featsIndex) || !featsIndex.length) return 0;
          let total = 0;
          for (const taken of updated.feats) {
            const takenId = String((taken && typeof taken === "object" && taken.id) || "").trim();
            const takenName = String((taken && typeof taken === "object" && taken.name) || taken || "").trim();
            const featDef = featsIndex.find(f => (
              (takenId && String(f?.id || "") === takenId) ||
              (!takenId && takenName && String(f?.name || "") === takenName)
            ));
            if (!featDef || !Array.isArray(featDef.effects)) continue;
            for (const effect of featDef.effects) {
              if (effect?.type !== "hp_max_bonus" || !effect?.per_level) continue;
              const amount = Number(effect.amount || 0);
              if (amount) total += amount;
            }
          }
          return total;
        })();
        if (existingPerLevelHpBonus) {
          const baseMax = Number(updated.maxHP) || 0;
          updated.maxHP = baseMax + existingPerLevelHpBonus;
          if (applyHpToCurrent) {
            const baseCurrent = Number(updated.currentHP) || 0;
            updated.currentHP = Math.min(updated.maxHP, baseCurrent + existingPerLevelHpBonus);
          }
        }

        const classEntry = lastOptions?.classEntry || null;
        const classChoices = classEntry?.choices || {};
        const isAsiLevel = hasASIAtLevel(rawLevel, lastOptions?.classFeatures, classEntry);
        let asiData = null;
        let featData = null;
        if (isAsiLevel) {
          const mode = readRadio("lu-asi-mode");
          if (mode === "asi") {
            const first = asi1?.value || "";
            const second = asi2?.value || "";
            if (!first) {
              setError("Select at least one ability for the ASI.");
              return;
            }
            if (!second && !asiDouble?.checked) {
              setError("Select a second ability or use +2 to the same ability.");
              return;
            }
            const abilities = { ...(updated.abilities || {}) };
            abilities[first] = (Number(abilities[first]) || 0) + 1;
            if (second) {
              abilities[second] = (Number(abilities[second]) || 0) + 1;
            } else {
              abilities[first] = (Number(abilities[first]) || 0) + 1;
            }
            updated.abilities = abilities;
            asiData = { first, second: second || first };
          } else if (mode === "feat") {
            const name = (featName?.value || "").trim();
            if (!name) {
              setError("Please choose a feat.");
              return;
            }
            const note = (featNotes?.value || "").trim();
            const featDef = featsIndex.find(f => String(f?.name || "") === String(name));
            if (!featDef) {
              setError("Selected feat could not be found.");
              return;
            }
            if (!canTakeFeatNow(updated, featDef)) {
              setError(`You can't take ${name} again right now.`);
              return;
            }
            const featChoices = Array.isArray(featDef?.choices) ? featDef.choices : [];
            const featSelections = {};
        if (featChoicesWrap && featChoices.length) {
          featChoicesWrap.querySelectorAll(".lu-choice-block").forEach(block => {
            const choiceId = block.dataset.choiceId;
            if (!choiceId) return;
            const values = [];
            block.querySelectorAll("select[data-choice-id]").forEach(sel => {
              if (sel.value) values.push(sel.value);
            });
            block.querySelectorAll("input[data-choice-id]").forEach(input => {
              if (input.value) values.push(input.value);
            });
            featSelections[choiceId] = values;
          });
              const previousFeatChoices = Array.isArray(updated?.choices?.featChoices) ? updated.choices.featChoices : [];
              const previousRows = previousFeatChoices.filter(r =>
                String(r?.featId || "").toLowerCase() === String(featDef?.id || "").toLowerCase()
                || String(r?.featName || "").toLowerCase() === String(featDef?.name || "").toLowerCase()
              );
              const priorValuesByChoice = new Map();
              for (const row of previousRows) {
                const byChoice = (row && typeof row.choices === "object" && row.choices) ? row.choices : {};
                for (const [cid, vals] of Object.entries(byChoice)) {
                  if (!Array.isArray(vals)) continue;
                  const set = priorValuesByChoice.get(cid) || new Set();
                  vals.forEach(v => { if (v != null && String(v).trim()) set.add(String(v).toLowerCase()); });
                  priorValuesByChoice.set(cid, set);
                }
              }
              for (const choice of featChoices) {
                const values = featSelections[choice.id] || [];
                const count = Number(choice.count || choice.choose || 1) || 1;
                if (values.length < count) {
                  setError(`Select ${count} option(s): ${choice.prompt || choice.id}`);
                  return;
                }
                if (choice.distinct && new Set(values).size !== values.length) {
                  setError(`Selections must be distinct: ${choice.prompt || choice.id}`);
                  return;
                }
                const uniqueAcrossRepeats = !!choice?.constraints?.unique_across_repeats;
                const repeatRuleChoiceId = String(featDef?.repeatable?.choice_id || "");
                const enforceDifferentByRepeatRule =
                  String(featDef?.repeatable?.rule || "").toLowerCase() === "different_choice"
                  && repeatRuleChoiceId
                  && repeatRuleChoiceId === String(choice.id || "");
                if (uniqueAcrossRepeats || enforceDifferentByRepeatRule) {
                  const prior = priorValuesByChoice.get(choice.id) || new Set();
                  const conflict = values.find(v => prior.has(String(v || "").toLowerCase()));
                  if (conflict) {
                    setError(`"${conflict}" was already chosen for ${name}. Choose a different option.`);
                    return;
                  }
                }
              }
            }
            if (!Array.isArray(updated.feats)) updated.feats = [];
            const fallbackDesc = summarizeFeatForUi(featDef) || `Taken at level ${rawLevel}.`;
            const featDescText = note || fallbackDesc;
            const featEntry = { id: featDef?.id || "", name, desc: featDescText };
            updated.feats.push(featEntry);
            if (!updated.choices) updated.choices = {};
            if (!Array.isArray(updated.choices.featChoices)) updated.choices.featChoices = [];
            if (featChoices.length) {
              updated.choices.featChoices.push({
                featId: featDef?.id || "",
                featName: name,
                choices: featSelections
              });
            }
            if (featDef?.effects?.length) {
              for (const effect of featDef.effects) {
                if (!effect || !effect.type) continue;
                if (effect.type === "ability_score_bonus") {
                  const ability = effect.ability || (effect.ability_from_choice ? (featSelections[effect.ability_from_choice] || [])[0] : "");
                  if (!ability) continue;
                  const abilities = { ...(updated.abilities || {}) };
                  const amount = Number(effect.amount || 0);
                  const currentVal = Number(abilities[ability]) || 0;
                  const max = Number(effect.max || 0) || 20;
                  abilities[ability] = Math.min(currentVal + amount, max);
                  updated.abilities = abilities;
                } else if (effect.type === "spell_grant") {
                  if (!Array.isArray(updated.spells)) updated.spells = [];
                  if (!updated.spellSources || typeof updated.spellSources !== "object") updated.spellSources = {};
                  if (!updated.spellCastingAbilityOverrides || typeof updated.spellCastingAbilityOverrides !== "object") {
                    updated.spellCastingAbilityOverrides = {};
                  }
                  const list = [
                    ...(effect.spells || []),
                    ...((effect.spells_from_choice && featSelections[effect.spells_from_choice]) || [])
                  ];
                  const resolveCastingAbility = () => {
                    const direct = String(effect.casting_ability || "").trim().toUpperCase();
                    if (direct) return direct;
                    if (effect.casting_ability_from_choice) {
                      const picked = String((featSelections[effect.casting_ability_from_choice] || [])[0] || "").trim().toUpperCase();
                      if (picked) return picked;
                    }
                    const map = effect.casting_ability_map && typeof effect.casting_ability_map === "object"
                      ? effect.casting_ability_map
                      : null;
                    const classChoiceId = String(effect.casting_ability_class_from_choice || "").trim();
                    if (map && classChoiceId) {
                      const pickedClass = String((featSelections[classChoiceId] || [])[0] || "").trim();
                      if (pickedClass) {
                        const mapKey = Object.keys(map).find(k => String(k || "").toLowerCase() === pickedClass.toLowerCase());
                        const mapped = String(mapKey ? map[mapKey] : "").trim().toUpperCase();
                        if (mapped) return mapped;
                      }
                    }
                    return "";
                  };
                  const castingAbilityResolved = resolveCastingAbility();
                  list.forEach(spell => {
                    if (!spell) return;
                    if (!updated.spells.some(s => String(s).toLowerCase() === String(spell).toLowerCase())) {
                      updated.spells.push(spell);
                    }
                    const keys = Object.keys(updated.spellSources);
                    const existing = keys.find(k => String(k || "").toLowerCase() === String(spell || "").toLowerCase());
                    const sourceLabel = featDef?.name || "Feat";
                    if (existing) updated.spellSources[existing] = sourceLabel;
                    else updated.spellSources[spell] = sourceLabel;
                    if (castingAbilityResolved) {
                      const abilityKeys = Object.keys(updated.spellCastingAbilityOverrides || {});
                      const existingAbilityKey = abilityKeys.find(k => String(k || "").toLowerCase() === String(spell || "").toLowerCase());
                      if (existingAbilityKey) updated.spellCastingAbilityOverrides[existingAbilityKey] = castingAbilityResolved;
                      else updated.spellCastingAbilityOverrides[spell] = castingAbilityResolved;
                    }
                  });
                  if (!Array.isArray(updated.choices.featSpellGrants)) updated.choices.featSpellGrants = [];
                  updated.choices.featSpellGrants.push({
                    featId: featDef?.id || "",
                    featName: name,
                    spells: list,
                    castingAbility: effect.casting_ability || null,
                    castingAbilityFromChoice: effect.casting_ability_from_choice || null,
                    castingAbilityMap: effect.casting_ability_map || null,
                    castingAbilityClassFromChoice: effect.casting_ability_class_from_choice || null
                  });
                } else if (effect.type === "action_grant") {
                  if (!Array.isArray(updated.actions)) updated.actions = [];
                  const existing = new Set(updated.actions.map(a => `${String(a.name || "").toLowerCase()}::${String(a.type || "").toLowerCase()}`));
                  const addAction = (action) => {
                    if (!action || !action.name) return;
                    const key = `${String(action.name || "").toLowerCase()}::${String(action.type || "").toLowerCase()}`;
                    if (existing.has(key)) return;
                    existing.add(key);
                    updated.actions.push({ ...action, source: featDef?.id || "feat" });
                  };
                  if (Array.isArray(effect.actions)) {
                    effect.actions.forEach(addAction);
                  } else if (effect.action) {
                    addAction(effect.action);
                  }
                } else if (effect.type === "tool_proficiency") {
                  updated.proficiencies = { ...(updated.proficiencies || {}) };
                  const tools = new Set(updated.proficiencies.tools || []);
                  const list = [
                    ...(effect.tools || []),
                    ...((effect.tools_from_choice && featSelections[effect.tools_from_choice]) || [])
                  ];
                  list.forEach(t => { if (t) tools.add(t); });
                  updated.proficiencies.tools = [...tools];
                } else if (effect.type === "weapon_proficiency") {
                  updated.proficiencies = { ...(updated.proficiencies || {}) };
                  const weapons = new Set(updated.proficiencies.weapons || []);
                  const list = [
                    ...(effect.weapons || []),
                    ...((effect.weapons_from_choice && featSelections[effect.weapons_from_choice]) || [])
                  ];
                  list.forEach(w => { if (w) weapons.add(w); });
                  updated.proficiencies.weapons = [...weapons];
                } else if (effect.type === "armor_proficiency") {
                  updated.proficiencies = { ...(updated.proficiencies || {}) };
                  const armor = new Set(updated.proficiencies.armor || []);
                  const list = [
                    ...(effect.armor || []),
                    ...((effect.armor_from_choice && featSelections[effect.armor_from_choice]) || [])
                  ];
                  list.forEach(a => { if (a) armor.add(a); });
                  updated.proficiencies.armor = [...armor];
                } else if (effect.type === "skill_or_tool_proficiency") {
                  const list = [
                    ...(effect.items || []),
                    ...((effect.items_from_choice && featSelections[effect.items_from_choice]) || [])
                  ];
                  updated.proficiencies = { ...(updated.proficiencies || {}) };
                  const skills = new Set(updated.proficiencies.skills || []);
                  const tools = new Set(updated.proficiencies.tools || []);
                  list.forEach(item => {
                    if (!item) return;
                    if (isSkillName(item)) skills.add(item);
                    else tools.add(item);
                  });
                  updated.proficiencies.skills = [...skills];
                  updated.proficiencies.tools = [...tools];
                } else if (effect.type === "skill_proficiency") {
                  updated.proficiencies = { ...(updated.proficiencies || {}) };
                  const skills = new Set(updated.proficiencies.skills || []);
                  const list = [
                    ...(effect.skills || []),
                    ...((effect.skills_from_choice && featSelections[effect.skills_from_choice]) || [])
                  ];
                  list.forEach(s => { if (s) skills.add(s); });
                  updated.proficiencies.skills = [...skills];
                } else if (effect.type === "language_grant") {
                  if (!Array.isArray(updated.languages)) updated.languages = [];
                  const list = [
                    ...(effect.languages || []),
                    ...((effect.languages_from_choice && featSelections[effect.languages_from_choice]) || [])
                  ];
                  list.forEach(l => {
                    if (!l) return;
                    if (!updated.languages.some(x => String(x).toLowerCase() === String(l).toLowerCase())) {
                      updated.languages.push(l);
                    }
                  });
                } else if (effect.type === "expertise") {
                  const list = [
                    ...(effect.skills || []),
                    ...((effect.skills_from_choice && featSelections[effect.skills_from_choice]) || [])
                  ];
                  if (!updated.skills) updated.skills = {};
                  updated.proficiencies = { ...(updated.proficiencies || {}) };
                  const profSkills = new Set(updated.proficiencies.skills || []);
                  list.forEach(skill => {
                    if (!skill) return;
                    updated.skills[skill] = "expertise";
                    profSkills.add(skill);
                  });
                  updated.proficiencies.skills = [...profSkills];
                } else if (effect.type === "initiative_bonus") {
                  const amount = Number(effect.amount || 0);
                  updated.bonusInitiative = (Number(updated.bonusInitiative) || 0) + amount;
                } else if (effect.type === "speed_bonus") {
                  const amount = Number(effect.amount || 0);
                  updated.speedBonus = (Number(updated.speedBonus) || 0) + amount;
                } else if (effect.type === "passive_rule") {
                  if (!Array.isArray(updated.passiveRules)) updated.passiveRules = [];
                  updated.passiveRules.push({ ...effect, source: featDef?.id || "" });
                } else if (effect.type === "saving_throw_proficiency") {
                  updated.proficiencies = { ...(updated.proficiencies || {}) };
                  const saves = new Set([
                    ...(Array.isArray(updated.proficiencies.saves) ? updated.proficiencies.saves : []),
                    ...(Array.isArray(updated.proficiencies.saving_throws) ? updated.proficiencies.saving_throws : []),
                    ...(Array.isArray(updated.skill_proficiencies?.["saving throws"]) ? updated.skill_proficiencies["saving throws"] : []),
                    ...(Array.isArray(updated.saving_throw_proficiencies) ? updated.saving_throw_proficiencies : [])
                  ].map(v => String(v || "").trim().slice(0, 3).toUpperCase()).filter(Boolean));
                  const fromAbilityChoice = (effect.ability_from_choice && featSelections[effect.ability_from_choice])
                    ? featSelections[effect.ability_from_choice].map(v => String(v || "").trim().slice(0, 3).toUpperCase())
                    : [];
                  const list = [
                    ...(effect.saves || []),
                    ...((effect.saves_from_choice && featSelections[effect.saves_from_choice]) || []),
                    ...fromAbilityChoice
                  ];
                  list.forEach(s => {
                    const norm = String(s || "").trim().slice(0, 3).toUpperCase();
                    if (norm) saves.add(norm);
                  });
                  updated.proficiencies.saving_throws = [...saves];
                } else if (effect.type === "maneuver_grant") {
                  if (!Array.isArray(updated.maneuvers)) updated.maneuvers = [];
                  const list = [
                    ...(effect.maneuvers || []),
                    ...((effect.maneuvers_from_choice && featSelections[effect.maneuvers_from_choice]) || [])
                  ];
                  list.forEach(m => {
                    if (!m) return;
                    if (!updated.maneuvers.some(x => String(x).toLowerCase() === String(m).toLowerCase())) {
                      updated.maneuvers.push(m);
                    }
                  });
                } else if (effect.type === "eldritch_invocation_grant") {
                  if (!Array.isArray(updated.invocations)) updated.invocations = [];
                  const list = [
                    ...(effect.invocations || []),
                    ...((effect.invocations_from_choice && featSelections[effect.invocations_from_choice]) || [])
                  ];
                  list.forEach(i => {
                    if (!i) return;
                    if (!updated.invocations.some(x => String(x).toLowerCase() === String(i).toLowerCase())) {
                      updated.invocations.push(i);
                    }
                  });
                } else if (effect.type === "save_dc_formula") {
                  if (!Array.isArray(updated.saveDcRules)) updated.saveDcRules = [];
                  const resolved = { ...effect, source: featDef?.id || "" };
                  if (!resolved.ability && effect.ability_from_choice) {
                    const picked = (featSelections[effect.ability_from_choice] || [])[0];
                    if (picked) resolved.ability = String(picked).trim().toUpperCase();
                  }
                  updated.saveDcRules.push(resolved);
                } else if (effect.type === "damage_resistance_ignore" || effect.type === "damage_die_floor") {
                  if (!Array.isArray(updated.damageRules)) updated.damageRules = [];
                  const resolved = { ...effect, source: featDef?.id || "" };
                  if (effect.damage_type_from_choice) {
                    const picked = (featSelections[effect.damage_type_from_choice] || [])[0];
                    if (picked) resolved.damage_type = String(picked).trim().toLowerCase();
                  }
                  updated.damageRules.push(resolved);
                } else if (effect.type === "replacement_rule") {
                  if (!Array.isArray(updated.replacementRules)) updated.replacementRules = [];
                  updated.replacementRules.push({ ...effect, source: featDef?.id || "" });
                } else if (effect.type === "resource_grant") {
                  if (!Array.isArray(updated.resources)) updated.resources = [];
                  const resolved = { ...effect, source: featDef?.id || "" };
                  if (Array.isArray(effect.consumes)) {
                    const consumes = [];
                    for (const item of effect.consumes) {
                      if (!item) continue;
                      if (item.spell_from_choice) {
                        const picks = featSelections[item.spell_from_choice] || [];
                        if (!picks.length) continue;
                        for (const spellName of picks) {
                          if (!spellName) continue;
                          const next = { ...item, spell: spellName };
                          delete next.spell_from_choice;
                          consumes.push(next);
                        }
                        continue;
                      }
                      consumes.push({ ...item });
                    }
                    resolved.consumes = consumes;
                  }
                  updated.resources.push(resolved);
                } else if (effect.type === "hp_max_bonus") {
                  const amount = Number(effect.amount || 0);
                  if (amount) {
                    const perLevel = !!effect.per_level;
                    const appliesImmediately = !!effect.applies_immediately;
                    const delta = perLevel
                      ? (appliesImmediately ? amount * (Number(updated.level) || 0) : amount)
                      : amount;
                    const baseMax = Number(updated.maxHP) || 0;
                    updated.maxHP = baseMax + delta;
                    if (applyHpToCurrent) {
                      const baseCurrent = Number(updated.currentHP) || 0;
                      updated.currentHP = Math.min(updated.maxHP, baseCurrent + delta);
                    }
                  }
                }
              }
            }
            featData = { name, notes: featDescText };
          }
        }

        let specialistChoiceData = null;
        let specialistFeatureNotes = "";
        if (decisionPlan) {
          const specialist = decisionSelections.find(s => s.type === "specialist");
          if (specialist?.value) {
            updated.build = specialist.value;
            specialistChoiceData = specialist.value;
          }
          const subclassChoice = decisionSelections.find(s => s.type === "subclass");
          if (subclassChoice?.value) {
            updated.build = subclassChoice.value;
            if (!updated.choices) updated.choices = {};
            updated.choices.subclass = subclassChoice.value;
            specialistChoiceData = specialistChoiceData || subclassChoice.value;
          }
          const note = decisionSelections.find(s => s.type === "note");
          if (note?.value) specialistFeatureNotes = note.value;
        } else if (Number(classChoices?.specialistChoice?.level) === rawLevel) {
          const choice = (specialistSelect?.value || "").trim();
          if (!choice) {
            setError("Select your Artificer specialist.");
            return;
          }
          updated.build = choice;
          specialistChoiceData = choice;
          specialistFeatureNotes = (specialistNotes?.value || "").trim();
        }

        const finalSubclassName = String(updated.build || current?.build || "");
        if (finalSubclassName && Array.isArray(lastOptions?.subclasses)) {
          const subclassEntry = lastOptions.subclasses.find(s =>
            String(s.name || "").toLowerCase() === finalSubclassName.toLowerCase() &&
            String(s.class || "").toLowerCase() === String(updated.class || current?.class || "").toLowerCase()
          );
          // Artificer specialization grants tool proficiencies at 3rd level,
          // but subclasses.json currently encodes this in feature text, not effect objects.
          // Apply it explicitly here so level-up stays rules-accurate.
          {
            const clsLower = String(updated.class || current?.class || "").toLowerCase();
            const subLower = String(finalSubclassName || "").toLowerCase();
            const subclassLevel = getSubclassLevel(classEntry, updated.class || current?.class || "");
            const pickedSubclassNow = !!specialistChoiceData || (oldLevel < subclassLevel && rawLevel >= subclassLevel);
            if (clsLower === "artificer" && pickedSubclassNow && rawLevel >= 3) {
              const toolBySubclass = {
                "alchemist": "Alchemist's Supplies",
                "armorer": "Smith's Tools",
                "artillerist": "Woodcarver's Tools",
                "battle smith": "Smith's Tools"
              };
              const baseTool = toolBySubclass[subLower] || "";
              if (baseTool) {
                updated.proficiencies = { ...(updated.proficiencies || {}) };
                const have = new Set(
                  (Array.isArray(updated.proficiencies.tools) ? updated.proficiencies.tools : [])
                    .map(t => String(t || "").trim())
                    .filter(Boolean)
                );
                const hasTool = [...have].some(t => t.toLowerCase() === baseTool.toLowerCase());
                if (!hasTool) {
                  have.add(baseTool);
                } else {
                  const artisanTools = [
                    "Alchemist's Supplies",
                    "Brewer's Supplies",
                    "Calligrapher's Supplies",
                    "Carpenter's Tools",
                    "Cartographer's Tools",
                    "Cobbler's Tools",
                    "Cook's Utensils",
                    "Glassblower's Tools",
                    "Jeweler's Tools",
                    "Leatherworker's Tools",
                    "Mason's Tools",
                    "Painter's Supplies",
                    "Potter's Tools",
                    "Smith's Tools",
                    "Tinker's Tools",
                    "Weaver's Tools",
                    "Woodcarver's Tools"
                  ];
                  const options = artisanTools.filter(t =>
                    ![...have].some(existing => existing.toLowerCase() === t.toLowerCase())
                  );
                  if (!options.length) {
                    setError("No alternate artisan tool proficiency is available to choose.");
                    return;
                  }
                  const pickedRaw = window.prompt(
                    `You already have ${baseTool}. Choose another artisan tool proficiency:\n${options.join(", ")}`,
                    options[0]
                  );
                  if (pickedRaw == null) {
                    setError("Select an alternate artisan tool proficiency to continue.");
                    return;
                  }
                  const picked = options.find(o => o.toLowerCase() === String(pickedRaw || "").trim().toLowerCase());
                  if (!picked) {
                    setError("Invalid artisan tool choice.");
                    return;
                  }
                  have.add(picked);
                }
                updated.proficiencies.tools = [...have];
              }
            }
          }
          if (subclassEntry?.spellcasting?.ability) {
            updated.spellcastingAbility = String(subclassEntry.spellcasting.ability || "").toUpperCase();
          }
          if (subclassEntry?.spellcasting?.progression) {
            updated.spellcastingProgression = subclassEntry.spellcasting.progression;
          }
          if (subclassEntry?.spellcasting?.list) {
            updated.spellcastingList = subclassEntry.spellcasting.list;
          }
        }

        const hasSpecialistFeature = (classChoices?.specialistFeatures?.levels || []).includes(rawLevel);

        const infusionDelta = getInfusionDelta(classEntry, oldLevel, rawLevel);
        let infusionsAdded = [];
        if (infusionDelta > 0) {
          const infusionChoice = decisionSelections.find(s => s.type === "infusion");
          if (infusionChoice?.values?.length) {
            const selected = infusionChoice.values;
            const existing = (current.infusions?.known || []);
            if (selected.length !== infusionDelta) {
              setError(`Select ${infusionDelta} new infusion(s).`);
              return;
            }
            const merged = existing.slice();
            for (const name of selected) {
              if (!merged.some(e => String(e).toLowerCase() === String(name).toLowerCase())) {
                merged.push(name);
              }
            }
            updated.infusions = { ...(updated.infusions || {}) };
            updated.infusions.known = merged;
            const prog = classEntry?.progression?.[String(rawLevel)] || {};
            if (typeof prog.infusionsKnown === "number") updated.infusions.known_limit = prog.infusionsKnown;
            if (typeof prog.infusedItems === "number") updated.infusions.active_limit = prog.infusedItems;
            infusionsAdded = selected.filter(name => !existing.some(e => String(e).toLowerCase() === String(name).toLowerCase()));
          } else if (infusionsList) {
            const checks = infusionsList?.querySelectorAll('input[type="checkbox"]') || [];
            const selected = [];
            checks.forEach(cb => { if (cb.checked) selected.push(cb.dataset.name); });
            const existing = (current.infusions?.known || []);
            const requiredTotal = existing.length + infusionDelta;
            if (selected.length !== requiredTotal) {
              setError(`Select ${infusionDelta} new infusion(s).`);
              return;
            }
            updated.infusions = { ...(updated.infusions || {}) };
            updated.infusions.known = selected;
            const prog = classEntry?.progression?.[String(rawLevel)] || {};
            if (typeof prog.infusionsKnown === "number") updated.infusions.known_limit = prog.infusionsKnown;
            if (typeof prog.infusedItems === "number") updated.infusions.active_limit = prog.infusedItems;
            infusionsAdded = selected.filter(name => !existing.some(e => String(e).toLowerCase() === String(name).toLowerCase()));
          }
        }

        const extraNotes = (notes?.value || "").trim();
        const selectedSpells = Array.isArray(lastOptions?.subclassSpells)
          ? lastOptions.subclassSpells
              .map(s => ({ name: s?.name || "", kind: s?.kind || "spell", source: s?.source || "" }))
              .filter(s => !!s.name)
          : [];

        if (selectedSpells.length) {
          if (!Array.isArray(updated.spells)) updated.spells = [];
          if (!updated.spellSources || typeof updated.spellSources !== "object") updated.spellSources = {};
          for (const entry of selectedSpells) {
            if (!entry.name) continue;
            if (!updated.spells.some(s => String(s).toLowerCase() === entry.name.toLowerCase())) {
              updated.spells.push(entry.name);
            }
            if (entry.source) {
              const keys = Object.keys(updated.spellSources);
              const hit = keys.find(k => String(k || "").toLowerCase() === String(entry.name || "").toLowerCase());
              if (hit) updated.spellSources[hit] = entry.source;
              else updated.spellSources[entry.name] = entry.source;
            }
          }
        }

        if (decisionGrants.length) {
          if (!Array.isArray(updated.spells)) updated.spells = [];
          const addSpell = (name) => {
            if (!name) return;
            if (!updated.spells.some(s => String(s).toLowerCase() === String(name).toLowerCase())) {
              updated.spells.push(name);
            }
          };
          for (const grant of decisionGrants) {
            const byLevel = grant?.grants?.alwaysPreparedSpells || {};
            for (const lvl of Object.keys(byLevel)) {
              if (Number(lvl) <= rawLevel) {
                (byLevel[lvl] || []).forEach(addSpell);
              }
            }
            const cantrips = grant?.grants?.bonusCantrips || {};
            for (const lvl of Object.keys(cantrips)) {
              if (Number(lvl) <= rawLevel) {
                (cantrips[lvl] || []).forEach(addSpell);
              }
            }
          }
          if (!updated.choices) updated.choices = {};
          if (!Array.isArray(updated.choices.subclassChoiceGrants)) {
            updated.choices.subclassChoiceGrants = [];
          }
          updated.choices.subclassChoiceGrants.push({
            level: rawLevel,
            grants: decisionGrants
          });
        }

        const pendingSpellStateSwaps = [];
        if (decisionSelections.length) {
          const classChoiceSelections = decisionSelections.filter(s => String(s.choiceId || "").startsWith("choice:class:"));
          if (classChoiceSelections.length) {
            if (!updated.choices) updated.choices = {};
            if (!Array.isArray(updated.choices.classChoices)) updated.choices.classChoices = [];
            classChoiceSelections.forEach(sel => {
              updated.choices.classChoices.push({
                level: rawLevel,
                choiceId: sel.choiceId,
                value: sel.value || "",
                values: sel.values || [],
                cantrips: sel.cantrips || [],
                taken: (typeof sel.taken === "boolean") ? sel.taken : undefined
              });
            });
          }

          const primalKnowledgePick = classChoiceSelections.find(sel =>
            String(sel.choiceId || "").includes(":optional:primal-knowledge:skill")
          );
          if (primalKnowledgePick?.value) {
            const typed = String(primalKnowledgePick.value || "").trim();
            const canonical = SKILL_LIST.find(s => s.toLowerCase() === typed.toLowerCase()) || typed;
            updated.proficiencies = { ...(updated.proficiencies || {}) };
            const profSkills = new Set(Array.isArray(updated.proficiencies.skills) ? updated.proficiencies.skills : []);
            profSkills.add(canonical);
            updated.proficiencies.skills = [...profSkills];

            updated.skill_proficiencies = { ...(updated.skill_proficiencies || {}) };
            const legacySkills = new Set(Array.isArray(updated.skill_proficiencies.skills) ? updated.skill_proficiencies.skills : []);
            legacySkills.add(canonical);
            updated.skill_proficiencies.skills = [...legacySkills];
          }

          const dedicatedWeaponPick = classChoiceSelections.find(sel =>
            String(sel.choiceId || "").includes(":optional:dedicated-weapon:weapon")
          );
          if (dedicatedWeaponPick?.value) {
            const pickedWeapon = String(dedicatedWeaponPick.value || "").trim();
            if (pickedWeapon) {
              if (!Array.isArray(updated.traits)) updated.traits = [];
              const existing = updated.traits.find(t =>
                String(t?.name || "").toLowerCase().startsWith("dedicated weapon:")
              );
              const traitName = `Dedicated Weapon: ${pickedWeapon}`;
              if (existing) existing.name = traitName;
              else updated.traits.push({ name: traitName, desc: "" });
            }
          }

          const glamourSkillPick = decisionSelections.find(sel =>
            String(sel.choiceId || "").includes("otherworldly-glamour")
          );
          if (glamourSkillPick?.value) {
            const typed = String(glamourSkillPick.value || "").trim();
            const canonical = SKILL_LIST.find(s => s.toLowerCase() === typed.toLowerCase()) || typed;
            const allowed = new Set(["deception", "performance", "persuasion"]);
            if (allowed.has(canonical.toLowerCase())) {
              updated.proficiencies = { ...(updated.proficiencies || {}) };
              const profSkills = new Set(Array.isArray(updated.proficiencies.skills) ? updated.proficiencies.skills : []);
              profSkills.add(canonical);
              updated.proficiencies.skills = [...profSkills];

              updated.skill_proficiencies = { ...(updated.skill_proficiencies || {}) };
              const legacySkills = new Set(Array.isArray(updated.skill_proficiencies.skills) ? updated.skill_proficiencies.skills : []);
              legacySkills.add(canonical);
              updated.skill_proficiencies.skills = [...legacySkills];
            }
          }

          const mergeColonTraitSelection = (traitPrefix, pickedValue) => {
            const next = String(pickedValue || "").trim();
            if (!next) return;
            if (!Array.isArray(updated.traits)) updated.traits = [];
            const lowerPrefix = String(traitPrefix || "").toLowerCase();
            const existing = updated.traits.find(t => {
              const nm = String(t?.name || '').trim().toLowerCase();
              return nm.startsWith(`${lowerPrefix}:`);
            });
            if (!existing) {
              updated.traits.push({ name: `${traitPrefix}: ${next}`, desc: "" });
              return;
            }
            const rawName = String(existing.name || '');
            const currentListRaw = rawName.split(':').slice(1).join(':').trim();
            const currentList = currentListRaw
              ? currentListRaw.split(',').map(s => String(s || '').trim()).filter(Boolean)
              : [];
            const already = currentList.some(v => v.toLowerCase() === next.toLowerCase());
            if (!already) currentList.push(next);
            existing.name = `${traitPrefix}: ${currentList.join(', ')}`;
          };

          const favoredEnemyPick = classChoiceSelections.find(sel =>
            String(sel.choiceId || "").toLowerCase().includes("favored_enemy")
          );
          if (favoredEnemyPick?.value || (Array.isArray(favoredEnemyPick?.values) && favoredEnemyPick.values[0])) {
            const pickedEnemy = favoredEnemyPick.value || favoredEnemyPick.values[0];
            mergeColonTraitSelection("Favored Enemy", pickedEnemy);

            const enemyToLanguage = {
              aberrations: "Deep Speech",
              celestials: "Celestial",
              dragons: "Draconic",
              elementals: "Primordial",
              fey: "Sylvan",
              fiends: "Infernal",
              giants: "Giant"
            };
            const enemyKey = String(pickedEnemy || "").trim().toLowerCase();
            const grantedLanguage = enemyToLanguage[enemyKey] || "";
            if (grantedLanguage) {
              const langs = new Set((Array.isArray(updated.languages) ? updated.languages : []).map(v => String(v || "").trim()));
              const hasLang = Array.from(langs).some(v => v.toLowerCase() === grantedLanguage.toLowerCase());
              if (!hasLang) langs.add(grantedLanguage);
              updated.languages = Array.from(langs);
            }
          }

          const favoredTerrainPick = classChoiceSelections.find(sel =>
            String(sel.choiceId || "").toLowerCase().includes("favored_terrain")
          );
          if (favoredTerrainPick?.value || (Array.isArray(favoredTerrainPick?.values) && favoredTerrainPick.values[0])) {
            mergeColonTraitSelection("Natural Explorer", favoredTerrainPick.value || favoredTerrainPick.values[0]);
          }

          const stylePick = classChoiceSelections.find(s => String(s.choiceId || "").includes("ranger_fighting_style"));
          if (stylePick?.value) {
            const styleName = stylePick.value;
            let styleDesc = "";
            const classChoices = classEntry?.choices || {};
            const styleOptions = classChoices?.fightingStyleChoice?.options || [];
            if (styleOptions.length) {
              const opt = styleOptions.find(o => (o.name || o) === styleName);
              styleDesc = opt?.desc || "";
            }
            if (!Array.isArray(updated.traits)) updated.traits = [];
            const traitName = `Fighting Style (${styleName})`;
            if (!updated.traits.some(t => String(t.name || "").toLowerCase() === traitName.toLowerCase())) {
              updated.traits.push({
                name: traitName,
                desc: styleDesc
              });
            }
          }

          if (stylePick?.value === "Druidic Warrior" && Array.isArray(stylePick.cantrips)) {
            if (!Array.isArray(updated.spells)) updated.spells = [];
            stylePick.cantrips.forEach(c => {
              if (!updated.spells.some(s => String(s).toLowerCase() === String(c).toLowerCase())) {
                updated.spells.push(c);
              }
            });
          }

          const decisionChoiceMap = new Map((decisionPlan?.choices || []).map(c => [c.id, c]));
          for (const sel of decisionSelections) {
            const choice = decisionChoiceMap.get(sel.choiceId);
            if (!choice) continue;
            if (choice.type === "cantrip" || choice.type === "spell") {
              if (!Array.isArray(updated.spells)) updated.spells = [];
              (sel.values || []).forEach(name => {
                if (!name) return;
                if (!updated.spells.some(s => String(s).toLowerCase() === String(name).toLowerCase())) {
                  updated.spells.push(name);
                }
              });
              if (!updated.choices) updated.choices = {};
              if (!Array.isArray(updated.choices.subclassSpellChoices)) updated.choices.subclassSpellChoices = [];
              updated.choices.subclassSpellChoices.push({
                level: rawLevel,
                choiceId: sel.choiceId,
                values: sel.values || []
              });
            }
            if (choice.type === "language") {
              const langs = new Set((Array.isArray(updated.languages) ? updated.languages : []).map(v => String(v || "").trim()));
              (sel.values || []).forEach(v => {
                const lang = String(v || "").trim();
                if (lang) langs.add(lang);
              });
              updated.languages = Array.from(langs);
            }
            if (choice.type === "skill") {
              const add = (name) => {
                const skill = String(name || "").trim();
                if (!skill) return;
                updated.proficiencies = { ...(updated.proficiencies || {}) };
                const profSkills = new Set(Array.isArray(updated.proficiencies.skills) ? updated.proficiencies.skills : []);
                profSkills.add(skill);
                updated.proficiencies.skills = Array.from(profSkills);

                updated.skill_proficiencies = { ...(updated.skill_proficiencies || {}) };
                const legacySkills = new Set(Array.isArray(updated.skill_proficiencies.skills) ? updated.skill_proficiencies.skills : []);
                legacySkills.add(skill);
                updated.skill_proficiencies.skills = Array.from(legacySkills);
              };
              (sel.values || []).forEach(add);
            }
            if (choice.type === "tool") {
              updated.proficiencies = { ...(updated.proficiencies || {}) };
              const tools = new Set(Array.isArray(updated.proficiencies.tools) ? updated.proficiencies.tools : []);
              (sel.values || []).forEach(v => {
                const tool = String(v || "").trim();
                if (tool) tools.add(tool);
              });
              updated.proficiencies.tools = Array.from(tools);
            }
            if (choice.type === "spell_swap") {
              const values = sel.values || [];
              const replaceName = values[0] || "";
              const newName = values[1] || "";
              if (replaceName && newName) {
                if (choice?.constraints?.useSpellStateKnown) {
                  pendingSpellStateSwaps.push({ from: replaceName, to: newName });
                } else {
                  if (!Array.isArray(updated.spells)) updated.spells = [];
                  updated.spells = updated.spells.filter(s => String(s).toLowerCase() !== replaceName.toLowerCase());
                  if (!updated.spells.some(s => String(s).toLowerCase() === String(newName).toLowerCase())) {
                    updated.spells.push(newName);
                  }
                }
                if (choice?.constraints?.classCantripOnly) {
                  if (!updated.spellSources || typeof updated.spellSources !== "object") updated.spellSources = {};
                  const keys = Object.keys(updated.spellSources);
                  const oldKey = keys.find(k => String(k || "").toLowerCase() === replaceName.toLowerCase());
                  if (oldKey && String(updated.spellSources[oldKey] || "").toLowerCase() === "class") {
                    delete updated.spellSources[oldKey];
                  }
                  const newKey = keys.find(k => String(k || "").toLowerCase() === newName.toLowerCase());
                  if (newKey) updated.spellSources[newKey] = "Class";
                  else updated.spellSources[newName] = "Class";
                }
                if (!updated.choices) updated.choices = {};
                if (!Array.isArray(updated.choices.spellSwaps)) updated.choices.spellSwaps = [];
                updated.choices.spellSwaps.push({
                  level: rawLevel,
                  from: replaceName,
                  to: newName
                });
              }
            }
            if (choice.type === "invocation_swap") {
              const values = sel.values || [];
              const replaceName = values[0] || "";
              const newName = values[1] || "";
              if (replaceName && newName) {
                if (!Array.isArray(updated.invocations)) updated.invocations = [];
                const oldLower = replaceName.toLowerCase();
                const idx = updated.invocations.findIndex(i => String(i || "").toLowerCase() === oldLower);
                if (idx >= 0) updated.invocations.splice(idx, 1);
                if (!updated.invocations.some(i => String(i || "").toLowerCase() === String(newName).toLowerCase())) {
                  updated.invocations.push(newName);
                }

                const featId = String(choice?.replacementRule?.sourceFeatId || "");
                const sourceChoiceId = String(choice?.replacementRule?.sourceChoiceId || "");
                if (featId && sourceChoiceId) {
                  if (!updated.choices) updated.choices = {};
                  if (!Array.isArray(updated.choices.featChoices)) updated.choices.featChoices = [];
                  const row = updated.choices.featChoices.find(r => String(r?.featId || "").toLowerCase() === featId.toLowerCase());
                  if (row) {
                    if (!row.choices || typeof row.choices !== "object") row.choices = {};
                    row.choices[sourceChoiceId] = [newName];
                  }
                }

                if (!updated.choices) updated.choices = {};
                if (!Array.isArray(updated.choices.invocationSwaps)) updated.choices.invocationSwaps = [];
                updated.choices.invocationSwaps.push({
                  level: rawLevel,
                  from: replaceName,
                  to: newName,
                  featId: String(choice?.replacementRule?.sourceFeatId || "")
                });
              }
            }
          }
        }

        if (pendingSpellStateSwaps.length && window.readSpellState && window.writeSpellState) {
          const st = window.readSpellState(current) || {};
          const preparedByLevel = (st && typeof st === "object" && st.preparedByLevel && typeof st.preparedByLevel === "object")
            ? st.preparedByLevel
            : {};
          const list = await loadSpellList();
          const spellMap = new Map(list.map(s => [String(s?.name || "").toLowerCase(), s]));
          for (const swap of pendingSpellStateSwaps) {
            const fromLower = String(swap.from || "").toLowerCase();
            const toName = String(swap.to || "");
            const toLower = toName.toLowerCase();
            for (const lvl of Object.keys(preparedByLevel)) {
              const arr = Array.isArray(preparedByLevel[lvl]) ? preparedByLevel[lvl] : [];
              preparedByLevel[lvl] = arr.filter(n => String(n || "").toLowerCase() !== fromLower);
            }
            const toSpell = spellMap.get(toLower);
            const toLevel = Number(toSpell?.level ?? toSpell?.level_int ?? 0);
            if (toName && toLevel > 0) {
              const bucket = Array.isArray(preparedByLevel[toLevel]) ? preparedByLevel[toLevel] : [];
              if (!bucket.some(n => String(n || "").toLowerCase() === toLower)) {
                bucket.push(toName);
              }
              preparedByLevel[toLevel] = bucket;
            }
          }
          st.preparedByLevel = preparedByLevel;
          window.writeSpellState(updated, st);
        }

        // Retroactive HP for Constitution modifier changes (5e rule).
        const originalConMod = Math.floor(((Number(current?.abilities?.CON ?? current?.abilities?.con ?? 10) || 10) - 10) / 2);
        const updatedConMod = Math.floor(((Number(updated?.abilities?.CON ?? updated?.abilities?.con ?? 10) || 10) - 10) / 2);
        const conModDelta = updatedConMod - originalConMod;
        const conHpAdjustment = conModDelta * rawLevel;
        if (conHpAdjustment !== 0) {
          const prevMax = Number(updated.maxHP) || 0;
          const prevCurrent = Number(updated.currentHP ?? prevMax) || 0;
          updated.maxHP = Math.max(1, prevMax + conHpAdjustment);
          updated.currentHP = Math.min(updated.maxHP, Math.max(0, prevCurrent + conHpAdjustment));
        }

        if (hpGain || asiData || featData || extraNotes || selectedSpells.length || specialistChoiceData || specialistFeatureNotes || infusionsAdded.length || conHpAdjustment) {
          if (!Array.isArray(updated.levelUpLog)) updated.levelUpLog = [];
          updated.levelUpLog.push({
            level: rawLevel,
            from: oldLevel,
            hitDie,
            conMod,
            hpGain,
            conHpAdjustment,
            asi: asiData,
            feat: featData,
            notes: extraNotes,
            specialistChoice: specialistChoiceData,
            specialistFeatureNotes: hasSpecialistFeature ? specialistFeatureNotes : "",
            infusionsAdded,
            spellsAdded: selectedSpells.map(s => s.name),
            decisionChoices: decisionSelections,
            at: new Date().toISOString()
          });
        }

        if (decisionSelections.length) {
          if (!updated.choices) updated.choices = {};
          if (!Array.isArray(updated.choices.levelUpDecisions)) updated.choices.levelUpDecisions = [];
          updated.choices.levelUpDecisions.push({
            level: rawLevel,
            choices: decisionSelections
          });
        }

        try {
          const result = await window.saveCharacter(filename, updated, { prompt: true });
          window.setCurrentCharacter(filename, updated);
          // Keep sheet HP snapshot aligned with level-up changes so re-render
          // does not restore stale pre-level values.
          try {
            const hpKey = `dd:hp::${String(updated?.name || '').toLowerCase()}`;
            if (hpKey !== 'dd:hp::' && window.STORAGE?.set) {
              window.STORAGE.set(hpKey, {
                currentHP: Number(updated.currentHP ?? updated.maxHP ?? 0),
                maxHP: Number(updated.maxHP || 0),
                ts: Date.now()
              });
            }
          } catch (_) { /* ignore snapshot write errors */ }
          if (typeof window.renderFromCharacterFile === "function") {
            await window.renderFromCharacterFile(filename);
          }

          const st = document.getElementById("status");
          if (st) {
            st.textContent = result?.persistedTo === "file"
              ? `Leveled up to ${rawLevel}. Saved to file.`
              : `Leveled up to ${rawLevel}. Saved locally.`;
            setTimeout(() => (st.textContent = ""), 2500);
          }
          close();
        } catch (err) {
          console.error("[LevelUp] Error:", err);
          setError("Level up failed. See console for details.");
        }
      };
    }

    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");
  }

  ready(() => {
    const btn = document.getElementById("level-up");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const current = window.getCurrentCharacter?.();
      if (!current) {
        alert("No character loaded.");
        return;
      }

      const filename = window.getCurrentCharacterFile?.() || window.STORAGE?.get("dd:lastChar");
      if (!filename) {
        alert("Could not determine character file.");
        return;
      }

      try {
        await openLevelUpModal(current, filename);
      } catch (err) {
        console.error("[LevelUp] Failed to open modal:", err);
        const st = document.getElementById("status");
        if (st) st.textContent = "Level up failed to open. See console.";
        alert("Level up failed to open. Check console for details.");
      }
    });
  });
})();
