/* every modal in modals-config.js as a tile. The config is the catalogue: one generic renderer
   turns each definition's fields into a form, and each action publishes the result on the bus
   under modal:<id>, so a save, an export or a check-in is a tag every other tile can hear. */
var MODAL_TILES = [
  // ===== POST-PRODUCTION MODALS =====
  {
    id: 'modal-export-xml',
    title: 'Export Open XML',
    type: 'export',
    description: 'Export timeline as FCP/DaVinci Open XML format',
    tags: ['timeline', 'export', 'post-production'],
    fields: [
      { name: 'filename', label: 'Filename', type: 'text', value: 'Sequence_Conform_24fps.xml' },
      { name: 'format', label: 'Format', type: 'select', options: ['4.0', '5.0', '5.1'], value: '4.0' },
      { name: 'includeEffects', label: 'Include Effects', type: 'checkbox', value: true },
    ],
    actions: ['export', 'cancel'],
    icon: 'fa-solid fa-file-export',
  },

  {
    id: 'modal-export-edl',
    title: 'Export CMX 3600 EDL',
    type: 'export',
    description: 'Export edit decision list for legacy systems',
    tags: ['timeline', 'export', 'post-production'],
    fields: [
      { name: 'filename', label: 'Filename', type: 'text', value: 'Master_Sequence_3600.edl' },
      { name: 'frameRate', label: 'Frame Rate', type: 'select', options: ['23.976', '24', '25', '29.97', '30'], value: '24' },
      { name: 'dropFrame', label: 'Drop Frame', type: 'checkbox', value: false },
    ],
    actions: ['export', 'cancel'],
    icon: 'fa-solid fa-list',
  },

  {
    id: 'modal-ingest-media',
    title: 'Ingest Media',
    type: 'import',
    description: 'Import video, audio, or image files',
    tags: ['media', 'import', 'assets'],
    fields: [
      { name: 'files', label: 'Select Files', type: 'file', multiple: true },
      { name: 'proxy', label: 'Create Proxy', type: 'checkbox', value: false },
      { name: 'location', label: 'Save Location', type: 'select', value: 'media-bin' },
    ],
    actions: ['import', 'cancel'],
    icon: 'fa-solid fa-download',
  },

  // ===== PRODUCTION MODALS =====
  {
    id: 'modal-shot-picker',
    title: 'Select Shot Framing',
    type: 'picker',
    description: 'Choose camera angle for this shot',
    tags: ['shots', 'production', 'script-sync'],
    fields: [
      { name: 'shotType', label: 'Shot Type', type: 'select',
        options: ['ground', 'knee', 'hip', 'shoulder', 'eye', 'overhead', 'dutch', 'ha', 'ots', 'insert'] },
    ],
    actions: ['select', 'cancel'],
    icon: 'fa-solid fa-camera',
  },

  {
    id: 'modal-schedule-adjust',
    title: 'Adjust Schedule',
    type: 'form',
    description: 'Modify shoot day and scene timing',
    tags: ['schedule', 'production', 'crew'],
    fields: [
      { name: 'sceneNumber', label: 'Scene #', type: 'number' },
      { name: 'shootDay', label: 'Shoot Day', type: 'number' },
      { name: 'startTime', label: 'Start Time', type: 'time' },
      { name: 'estimatedPages', label: 'Est. Pages', type: 'number', step: 0.125 },
    ],
    actions: ['save', 'cancel'],
    icon: 'fa-solid fa-calendar',
  },

  {
    id: 'modal-cast-edit',
    title: 'Edit Cast Member',
    type: 'form',
    description: 'Update costume, makeup, and scene appearances',
    tags: ['cast', 'production', 'crew', 'script-sync'],
    fields: [
      { name: 'characterName', label: 'Character', type: 'text' },
      { name: 'costume', label: 'Costume Notes', type: 'textarea' },
      { name: 'makeup', label: 'SFX Makeup', type: 'textarea' },
      { name: 'appearsInScenes', label: 'Scenes', type: 'text', placeholder: '1, 3, 5' },
    ],
    actions: ['save', 'cancel'],
    icon: 'fa-solid fa-user',
  },

  // ===== PRE-PRODUCTION MODALS =====
  {
    id: 'modal-character-detail',
    title: 'Character Details',
    type: 'form',
    description: 'Full character breakdown and appearance tracking',
    tags: ['characters', 'script-sync', 'breakdown'],
    fields: [
      { name: 'name', label: 'Character Name', type: 'text' },
      { name: 'actor', label: 'Actor', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'firstAppearance', label: 'First Scene', type: 'number' },
      { name: 'lastAppearance', label: 'Last Scene', type: 'number' },
    ],
    actions: ['save', 'cancel'],
    icon: 'fa-solid fa-user-tie',
  },

  {
    id: 'modal-location-detail',
    title: 'Location Information',
    type: 'form',
    description: 'Address, permits, parking, and production notes',
    tags: ['locations', 'script-sync', 'breakdown', 'production'],
    fields: [
      { name: 'heading', label: 'Script Heading', type: 'text' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'parking', label: 'Parking', type: 'textarea' },
      { name: 'permits', label: 'Permit Status', type: 'select', options: ['pending', 'approved', 'denied', 'exempt'] },
    ],
    actions: ['save', 'cancel'],
    icon: 'fa-solid fa-map-pin',
  },

  {
    id: 'modal-script-edit',
    title: 'Edit Screenplay',
    type: 'editor',
    description: 'Live screenplay editing with auto-sync to breakdown',
    tags: ['screenplay', 'master-script', 'script-sync'],
    fields: [
      { name: 'screenplay', label: 'Screenplay Text', type: 'textarea', rows: 20 },
      { name: 'autoSync', label: 'Auto-sync to breakdown', type: 'checkbox', value: true },
    ],
    actions: ['sync', 'cancel'],
    icon: 'fa-solid fa-scroll',
  },

  // ===== STUDIO BINDER MODALS =====
  {
    id: 'modal-vendor-management',
    title: 'Vendor Management',
    type: 'form',
    description: 'Add, update, and manage production vendors',
    tags: ['vendors', 'studio-binder', 'logistics'],
    fields: [
      { name: 'vendorName', label: 'Vendor Name', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['rental', 'catering', 'transport', 'grip', 'lighting', 'camera', 'audio', 'other'] },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'address', label: 'Address', type: 'textarea' },
    ],
    actions: ['save', 'cancel'],
    icon: 'fa-solid fa-handshake',
  },

  {
    id: 'modal-crew-checkin',
    title: 'Crew Check-In',
    type: 'form',
    description: 'Log crew arrivals and departures with SMS notifications',
    tags: ['checkins', 'studio-binder', 'crew', 'sms'],
    fields: [
      { name: 'crewName', label: 'Crew Member', type: 'text' },
      { name: 'role', label: 'Role', type: 'select', options: ['director', 'dp', '1st ac', 'gaffer', 'key grip', 'production manager'] },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'vehicle', label: 'Vehicle', type: 'text', placeholder: 'License plate or vehicle info' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    actions: ['checkin', 'checkout', 'cancel'],
    icon: 'fa-solid fa-clipboard-check',
  },

  {
    id: 'modal-production-board',
    title: 'Production Board',
    type: 'form',
    description: 'Daily production schedule, crew call times, and logistics',
    tags: ['schedule', 'studio-binder', 'production'],
    fields: [
      { name: 'shootDate', label: 'Shoot Date', type: 'text' },
      { name: 'callTime', label: 'Call Time', type: 'time' },
      { name: 'scenes', label: 'Scenes (comma-separated)', type: 'text' },
      { name: 'locations', label: 'Locations', type: 'textarea' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    actions: ['save', 'cancel'],
    icon: 'fa-solid fa-clipboard-list',
  },

  // ===== GLOBAL MODALS =====
  {
    id: 'modal-export-master',
    title: 'Master Export & Print Studio',
    type: 'export',
    description: 'Export multiple formats and arrange print layout',
    tags: ['export', 'master', 'studio-binder'],
    fields: [
      { name: 'formats', label: 'Export Formats', type: 'checkbox-group',
        options: ['schedule', 'callsheet', 'budget', 'oneliners', 'shots', 'cast'] },
      { name: 'printLayout', label: 'Print Order', type: 'select' },
    ],
    actions: ['export', 'cancel'],
    icon: 'fa-solid fa-box-archive',
  },

  {
    id: 'modal-asset-upload',
    title: 'Upload Assets',
    type: 'import',
    description: 'Bulk upload media, photos, or documents',
    tags: ['assets', 'media', 'import'],
    fields: [
      { name: 'files', label: 'Select Files', type: 'file', multiple: true },
      { name: 'department', label: 'Department', type: 'select',
        options: ['dailies', 'reference', 'audio', 'documentation', 'props', 'vfx'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    actions: ['upload', 'cancel'],
    icon: 'fa-solid fa-cloud-arrow-up',
  },

  {
    id: 'modal-settings',
    title: 'Global Settings',
    type: 'form',
    description: 'Configure project defaults and preferences',
    tags: ['settings', 'configuration', 'sms'],
    fields: [
      { name: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'CAD'] },
      { name: 'unionRules', label: 'Union', type: 'select', options: ['SAG-AFTRA', 'IATSE', 'Non-Union', 'International'] },
      { name: 'shootHours', label: 'Hours/Day', type: 'number', min: 4, max: 18, step: 0.5 },
      { name: 'smsEnabled', label: 'Enable SMS Notifications', type: 'checkbox', value: false },
      { name: 'autoSave', label: 'Auto-save', type: 'checkbox', value: true },
    ],
    actions: ['save', 'cancel'],
    icon: 'fa-solid fa-sliders',
  },
];

var MODAL_COLOUR = { export:'#5AA9E6', import:'#8FC13F', ingest:'#8FC13F', edit:'#E2A93B',
  manage:'#A78BFA', settings:'#7E8FA6', schedule:'#E8703A', cast:'#C08457', character:'#C08457',
  location:'#4FB3A6', crew:'#8FC13F', production:'#D64541', asset:'#B07CE8', shot:'#E2A93B' };

function modalField(f) {
  var label = HUB.esc(f.label || f.name || '');
  var name = HUB.esc(f.name || '');
  var html = '<label class="note" style="display:block;margin:10px 0 3px">' + label + '</label>';
  if (f.type === 'select') {
    html += '<select data-f="' + name + '">' + (f.options || []).map(function (o) {
      return '<option' + (String(o) === String(f.value) ? ' selected' : '') + '>' + HUB.esc(o) + '</option>';
    }).join('') + '</select>';
  } else if (f.type === 'checkbox') {
    html += '<input type="checkbox" data-f="' + name + '"' + (f.value ? ' checked' : '') + ' style="width:auto">';
  } else if (f.type === 'textarea') {
    html += '<textarea data-f="' + name + '" rows="5">' + HUB.esc(f.value == null ? '' : f.value) + '</textarea>';
  } else {
    html += '<input data-f="' + name + '" value="' + HUB.esc(f.value == null ? '' : f.value) + '">';
  }
  return html;
}

for (var mi = 0; mi < MODAL_TILES.length; mi++) {
  (function (def) {
    HUB.reg({
      id: 'modal-' + def.id,
      title: def.title || def.id,
      sub: def.description || ('modal · ' + (def.type || 'action')),
      tag: def.type || 'modal',
      colour: MODAL_COLOUR[def.type] || '#E2A93B',
      render: function (box) {
        var html = ['<p class="note">' + HUB.esc(def.description || '') + '</p>'];
        var fields = def.fields || [];
        for (var i = 0; i < fields.length; i++) html.push(modalField(fields[i]));
        html.push('<div class="row" style="margin-top:14px;gap:8px">');
        var acts = def.actions || ['save'];
        for (var a = 0; a < acts.length; a++) {
          html.push('<button class="' + (a === 0 ? 'pri' : '') + '" data-act="' + HUB.esc(acts[a]) + '">' + HUB.esc(acts[a]) + '</button>');
        }
        html.push('</div><p class="note" id="modalOut" style="margin-top:10px"></p>');
        box.innerHTML = html.join('');

        var buttons = box.querySelectorAll('[data-act]');
        for (var k = 0; k < buttons.length; k++) {
          buttons[k].onclick = function () {
            var values = {};
            var inputs = box.querySelectorAll('[data-f]');
            for (var n = 0; n < inputs.length; n++) {
              var el = inputs[n];
              values[el.getAttribute('data-f')] = (el.type === 'checkbox') ? el.checked : el.value;
            }
            var action = this.getAttribute('data-act');
            var payload = { modal: def.id, action: action, values: values, tags: def.tags || [],
                            at: new Date().toISOString() };
            try { ModalSync.publish('modal:' + def.id, payload, 'tile'); } catch (e) {}
            try { ModalSync.publish('modals:events', payload, 'tile'); } catch (e) {}
            var out = document.getElementById('modalOut');
            if (out) out.textContent = action + ' · published to modal:' + def.id + ' and modals:events';
          };
        }
      }
    });
  })(MODAL_TILES[mi]);
}
