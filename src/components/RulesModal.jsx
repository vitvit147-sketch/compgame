import React, { useState } from 'react';
import { ROLES, FACTIONS } from '../data/rolesData';
import { X, Search, Shield, Moon, Users, Sparkles } from 'lucide-react';

export function RulesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'night_order' | 'renegades'
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredRoles = Object.values(ROLES).filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog rules-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">📖</span>
            <h2>Справочник ролей и регламент игры</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Табы */}
        <div className="rules-tabs">
          <button 
            className={`rules-tab ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            🎭 Все роли ({Object.keys(ROLES).length})
          </button>
          <button 
            className={`rules-tab ${activeTab === 'night_order' ? 'active' : ''}`}
            onClick={() => setActiveTab('night_order')}
          >
            🌙 Очередность ночи
          </button>
          <button 
            className={`rules-tab ${activeTab === 'renegades' ? 'active' : ''}`}
            onClick={() => setActiveTab('renegades')}
          >
            ⚔️ Отщепенцы и Спецроли
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'roles' && (
            <div>
              <div className="rules-search-bar">
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Поиск роли по названию или свойству..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="rules-roles-grid">
                {filteredRoles.map(role => {
                  const faction = FACTIONS[role.faction.toUpperCase()];
                  return (
                    <div key={role.id} className="rule-card" style={{ borderLeftColor: faction?.color }}>
                      <div className="rule-card-top">
                        <span className="rule-role-name">{role.name}</span>
                        <span className="rule-faction-pill" style={{ color: faction?.color }}>
                          {faction?.badge} {faction?.name}
                        </span>
                      </div>
                      <p className="rule-role-desc">{role.description}</p>
                      {role.speechNight && (
                        <div className="rule-speech-hint">
                          <strong>Реплика ночи:</strong> «{role.speechNight}»
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'night_order' && (
            <div className="night-order-guide">
              <p className="guide-intro">
                Строгий порядок ночного пробуждения предотвращает ошибки ведущего. Более ранние действия (например, блок Путаны) отменяют последующие.
              </p>
              <div className="order-steps-list">
                <div className="order-step-row">
                  <span className="order-num">1</span>
                  <div className="order-info">
                    <h4>Путана / Любовница</h4>
                    <p>Блокирует способность выбранного игрока на всю ночь.</p>
                  </div>
                </div>
                <div className="order-step-row">
                  <span className="order-num">2</span>
                  <div className="order-info">
                    <h4>Шулер & Вор</h4>
                    <p>Шулер меняет двух игроков местами, Вор похищает способность.</p>
                  </div>
                </div>
                <div className="order-step-row">
                  <span className="order-num">3</span>
                  <div className="order-info">
                    <h4>Адвокат Мафии</h4>
                    <p>Дает алиби члену мафии против ночной проверки Шерифа.</p>
                  </div>
                </div>
                <div className="order-step-row">
                  <span className="order-num">4</span>
                  <div className="order-info">
                    <h4>Доктор & Телохранитель</h4>
                    <p>Устанавливают защиту. Доктор исцеляет 1 пулю, Телохранитель принимает огонь на себя.</p>
                  </div>
                </div>
                <div className="order-step-row">
                  <span className="order-num">5</span>
                  <div className="order-info">
                    <h4>Мафия (Коллективный выстрел)</h4>
                    <p>Дон и мафиози выбирают жертву для ликвидации.</p>
                  </div>
                </div>
                <div className="order-step-row">
                  <span className="order-num">6</span>
                  <div className="order-info">
                    <h4>Дон Мафии</h4>
                    <p>Ищет Шерифа города.</p>
                  </div>
                </div>
                <div className="order-step-row">
                  <span className="order-num">7</span>
                  <div className="order-info">
                    <h4>Маньяк</h4>
                    <p>Совершает одиночный независимый выстрел.</p>
                  </div>
                </div>
                <div className="order-step-row">
                  <span className="order-num">8</span>
                  <div className="order-info">
                    <h4>Революционер</h4>
                    <p>Вербует мирного жителя в свою Ячейку Восстания.</p>
                  </div>
                </div>
                <div className="order-step-row">
                  <span className="order-num">9</span>
                  <div className="order-info">
                    <h4>Комиссар (Шериф) / Сержант</h4>
                    <p>Проверяет игрока на причастность к мафии.</p>
                  </div>
                </div>
                <div className="order-step-row">
                  <span className="order-num">10</span>
                  <div className="order-info">
                    <h4>Журналист / Священник / Свидетель</h4>
                    <p>Сбор информации и наблюдение.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'renegades' && (
            <div className="special-roles-guide">
              <div className="special-role-box">
                <div className="special-title">
                  <Sparkles size={20} className="text-yellow-400" />
                  <h3>Счастливчик (Удачливый житель)</h3>
                </div>
                <p>
                  Обладает врожденным щитом от первого нападения. Если мафия или маньяк стреляют в Счастливчика в первый раз — он не погибает! 
                  Ведущий утром объявляет: <em>«Был выстрел, но раненый выжил!»</em>.
                  После первого спасения щит сгорает, и повторный выстрел убьет его.
                </p>
              </div>

              <div className="special-role-box">
                <div className="special-title">
                  <span className="text-purple-400 font-bold">🚩</span>
                  <h3>Революционер (Лидер мятежников)</h3>
                </div>
                <p>
                  Каждую ночь вербует одного жителя в свою «Ячейку Революции». Если цель мирная — игрок в тайне присоединяется к революции. 
                  Если цель из мафии — вербовка не удается.
                  Революция побеждает, как только численность завербованных жителей превысит половину оставшихся в живых!
                </p>
              </div>

              <div className="special-role-box">
                <div className="special-title">
                  <span className="text-red-500 font-bold">💣</span>
                  <h3>Камикадзе (Провокатор / Шут)</h3>
                </div>
                <p>
                  Побеждает немедленно и единолично, если город приговаривает его к казни на дневном голосовании! Если его убивают ночью мафия или маньяк — он проигрывает.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
