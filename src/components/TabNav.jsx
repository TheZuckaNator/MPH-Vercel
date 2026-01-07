import './TabNav.css'

function TabNav({ activeTab, onTabChange, isAdmin }) {
  const tabs = [
    { id: 'primary', label: 'Primary Sale', icon: '🏪' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛒' },
    { id: 'inventory', label: 'Inventory', icon: '🎒' }
  ]
  
  if (isAdmin) tabs.push({ id: 'admin', label: 'Admin', icon: '⚙️' })
  
  return (
    <nav className="tab-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={activeTab === tab.id ? 'active' : ''}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default TabNav
