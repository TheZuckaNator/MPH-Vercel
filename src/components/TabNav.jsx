import './TabNav.css'

function TabNav({ activeTab, onTabChange, isAdmin }) {
  return (
    <nav className="tab-nav">
      <button 
        className={activeTab === 'primary' ? 'active' : ''} 
        onClick={() => onTabChange('primary')}
      >
        Primary Store
      </button>
      <button 
        className={activeTab === 'studiochain' ? 'active' : ''} 
        onClick={() => onTabChange('studiochain')}
      >
        StudioChain
      </button>
      <button 
        className={activeTab === 'marketplace' ? 'active' : ''} 
        onClick={() => onTabChange('marketplace')}
      >
        Marketplace
      </button>
      <button 
        className={activeTab === 'inventory' ? 'active' : ''} 
        onClick={() => onTabChange('inventory')}
      >
        Inventory
      </button>
      {isAdmin && (
        <button 
          className={activeTab === 'admin' ? 'active' : ''} 
          onClick={() => onTabChange('admin')}
        >
          Admin
        </button>
      )}
    </nav>
  )
}

export default TabNav