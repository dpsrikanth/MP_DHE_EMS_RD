const fs = require('fs');

const fields = [
  ['middle_name', 'Middle Name', 'User', 'text', 'e.g. Singh'],
  ['gender', 'Gender', 'User', 'text', 'e.g. Male/Female'],
  ['student_status', 'Status', 'Activity', 'text', 'e.g. Active'],
  ['rte', 'RTE', 'Shield', 'text', 'e.g. Yes/No'],
  ['birth_place', 'Birth Place', 'MapPin', 'text', 'e.g. Bhopal'],
  ['hostel_or_day_scholar', 'Hostel/Day Scholar', 'Building2', 'text', 'e.g. Day/Hostel'],
  ['language', 'Language', 'FileText', 'text', 'e.g. Hindi'],
  ['phone', 'Secondary Phone', 'Phone', 'text', 'e.g. 9876543210'],
  ['sms_enabled', 'SMS Enabled', 'Mail', 'text', 'e.g. Yes/No'],
  ['ems_enabled', 'EMS Enabled', 'Shield', 'text', 'e.g. Yes/No'],
  ['address_line_1', 'Address Line 1', 'MapPin', 'text', 'e.g. 123 Main St'],
  ['city', 'City', 'MapPin', 'text', 'e.g. Bhopal'],
  ['state', 'State', 'MapPin', 'text', 'e.g. Madhya Pradesh'],
  ['country', 'Country', 'MapPin', 'text', 'e.g. India'],
  ['pin_code', 'Pin Code', 'Hash', 'text', 'e.g. 462001'],
  ['father_first_name', 'Father First Name', 'User', 'text', 'e.g. Raj'],
  ['father_last_name', 'Father Last Name', 'User', 'text', 'e.g. Kumar'],
  ['father_mobile_phone', 'Father Mobile', 'Phone', 'text', 'e.g. 9876543210'],
  ['father_address_email', 'Father Email', 'Mail', 'email', 'e.g. father@example.com'],
  ['father_state', 'Father State', 'MapPin', 'text', 'e.g. MP'],
  ['father_pin_code', 'Father Pin Code', 'Hash', 'text', 'e.g. 462001'],
  ['mother_first_name', 'Mother First Name', 'User', 'text', 'e.g. Sita'],
  ['mother_last_name', 'Mother Last Name', 'User', 'text', 'e.g. Devi'],
  ['mother_mobile_phone', 'Mother Mobile', 'Phone', 'text', 'e.g. 9876543210'],
  ['mother_address_email', 'Mother Email', 'Mail', 'email', 'e.g. mother@example.com'],
  ['mother_state', 'Mother State', 'MapPin', 'text', 'e.g. MP'],
  ['mother_pin_code', 'Mother Pin Code', 'Hash', 'text', 'e.g. 462001'],
];

const gen = (name, label, icon, type, placeholder, isEdit) => `
                {/* ${label} */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">${label}</label>
                  <div className="relative">
                    <${icon} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      ${type !== 'text' ? `type="${type}"` : ''}
                      name="${name}" 
                      value={${isEdit ? 'editForm' : 'addForm'}.${name}} 
                      onChange={${isEdit ? 'handleEditChange' : 'handleAddChange'}} 
                      placeholder="${placeholder}"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>`;

fs.writeFileSync('add_fields.txt', fields.map(f => gen(...f, false)).join('\n'));
fs.writeFileSync('edit_fields.txt', fields.map(f => gen(...f, true)).join('\n'));
