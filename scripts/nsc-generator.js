// Splittermond NSC Generator
// Hauptfunktionalität des Plugins

import { SplittermondData } from './splittermond-data.js';

// Klasse für den NSC Generator
class SplittermondNscGenerator {
  constructor() {
    this.data = new SplittermondData();
    this.registerHooks();
    this.registerSettings();
  }

  // Registrierung der Foundry VTT Hooks
  registerHooks() {
    Hooks.on('renderActorDirectory', this.addButton.bind(this));
  }

  // Registrierung der Modul-Einstellungen
  registerSettings() {
    game.settings.register('splittermond-nsc-generator', 'sourcebooks', {
      name: "Quellenbände",
      hint: "Welche Splittermond-Quellenbände sollen für die NSC-Generierung verwendet werden",
      scope: "world",
      config: true,
      type: Object,
      default: {
        "Grundregelwerk": true,
        "Bestiarum": true,
        "Wege der Magie": false,
        "Wege des Glaubens": false,
        "Wege der Helden": false
      }
    });
    
    game.settings.register('splittermond-nsc-generator', 'defaultLevel', {
      name: "Standard-Stufe",
      hint: "Standard-Stufe für neu generierte NSCs",
      scope: "world",
      config: true,
      type: Number,
      default: 1,
      range: {
        min: 1,
        max: 15,
        step: 1
      }
    });
    
    game.settings.register('splittermond-nsc-generator', 'defaultType', {
      name: "Standard-Typ",
      hint: "Standard-Typ für neu generierte NSCs",
      scope: "world",
      config: true,
      type: String,
      default: "Standard",
      choices: {
        "Standard": "Standard",
        "Elite": "Elite",
        "Boss": "Boss",
        "Helfer": "Helfer",
        "Statist": "Statist"
      }
    });
  }

  // Button zum Akteur-Verzeichnis hinzufügen
  addButton(app, html) {
    const button = $(`<button class="splittermond-nsc-btn"><i class="fas fa-user-plus"></i> NSC generieren</button>`);
    button.click(this.openGenerator.bind(this));
    html.find('.directory-header .header-actions').append(button);
  }

  // Generator-Dialog öffnen
  async openGenerator() {
    const template = 'modules/splittermond-nsc-generator/templates/nsc-generator.html';
    const html = await renderTemplate(template, {
      types: this.data.getNscTypes(),
      sourcebooks: this.data.getSourcebooks(),
      defaultLevel: game.settings.get('splittermond-nsc-generator', 'defaultLevel'),
      defaultType: game.settings.get('splittermond-nsc-generator', 'defaultType')
    });

    new Dialog({
      title: "Splittermond NSC Generator",
      content: html,
      buttons: {
        generate: {
          icon: '<i class="fas fa-dice"></i>',
          label: "Generieren",
          callback: html => this.generateNsc(html)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Abbrechen"
        }
      },
      default: "generate",
      width: 400
    }).render(true);
  }

  // NSC generieren basierend auf den Einstellungen
  async generateNsc(html) {
    const form = html.find('form')[0];
    const formData = new FormDataExtended(form).object;
    
    // Generiere NSC-Daten basierend auf den ausgewählten Optionen
    const nscData = this.data.generateNscData(formData);
    
    // Erstelle neuen Akteur in Foundry VTT
    const actor = await Actor.create({
      name: nscData.name,
      type: "npc",
      img: nscData.img || "icons/svg/mystery-man.svg",
      system: nscData.system
    });
    
    // Füge Angriffe und Fähigkeiten hinzu
    if (nscData.attacks && nscData.attacks.length > 0) {
      for (let attack of nscData.attacks) {
        await actor.createEmbeddedDocuments("Item", [attack]);
      }
    }
    
    if (nscData.features && nscData.features.length > 0) {
      for (let feature of nscData.features) {
        await actor.createEmbeddedDocuments("Item", [feature]);
      }
    }
    
    // Akteur-Sheet öffnen
    actor.sheet.render(true);
    
    ui.notifications.info(`NSC "${nscData.name}" wurde erfolgreich erstellt!`);
  }
}

// Modul-Instanz erzeugen, wenn Foundry initialisiert wird
Hooks.once('init', () => {
  console.log('Splittermond NSC Generator | Initialisierung');
});

// Modul-Instanz erzeugen, wenn Foundry bereit ist
Hooks.once('ready', () => {
  game.splittermondNscGenerator = new SplittermondNscGenerator();
  console.log('Splittermond NSC Generator | Bereit');
});