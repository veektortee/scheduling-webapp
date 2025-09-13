// State Persistence Test Utility
// Run this in the browser console to check localStorage contents

console.log('=== State Persistence Test Utility ===\n');

// Function to display localStorage contents
function checkLocalStorage() {
  console.log('📁 LocalStorage Contents:');
  
  const keys = [
    'scheduling-state-v1',
    'scheduling-last-results-v1', 
    'calendarState'
  ];
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`\n🔑 ${key}:`);
        console.log('  Size:', value.length, 'chars');
        console.log('  Data preview:', Object.keys(parsed));
        
        if (key === 'scheduling-state-v1') {
          console.log('  - Shifts:', parsed.case?.shifts?.length || 0);
          console.log('  - Providers:', parsed.case?.providers?.length || 0);
          console.log('  - Selected Date:', parsed.selectedDate);
          console.log('  - Selected Provider:', parsed.selectedProvider);
          console.log('  - Timestamp:', parsed.timestamp);
        }
        
        if (key === 'calendarState') {
          console.log('  - Events:', parsed.events?.length || 0);
          console.log('  - Tasks:', parsed.tasks?.length || 0);
          console.log('  - Categories:', parsed.categories?.length || 0);
        }
      } catch (e) {
        console.log(`\n🔑 ${key}: Invalid JSON`);
      }
    } else {
      console.log(`\n🔑 ${key}: Not found`);
    }
  });
}

// Function to clear all state (for testing)
function clearAllState() {
  const keys = [
    'scheduling-state-v1',
    'scheduling-last-results-v1', 
    'calendarState'
  ];
  
  keys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('🗑️  All state cleared!');
}

// Function to simulate state age test
function checkStateAge() {
  const schedulingState = localStorage.getItem('scheduling-state-v1');
  if (schedulingState) {
    try {
      const parsed = JSON.parse(schedulingState);
      const age = Date.now() - new Date(parsed.timestamp).getTime();
      const days = Math.floor(age / (24 * 60 * 60 * 1000));
      const hours = Math.floor((age % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      
      console.log(`\n⏰ Scheduling State Age: ${days} days, ${hours} hours`);
      console.log('   Expires after: 7 days');
      console.log('   Status:', days >= 7 ? '❌ Expired' : '✅ Valid');
    } catch (e) {
      console.log('\n⏰ Could not check scheduling state age');
    }
  }
}

// Main functions
console.log('Available functions:');
console.log('- checkLocalStorage() - View current state');
console.log('- clearAllState() - Clear all persisted data');
console.log('- checkStateAge() - Check if data has expired');
console.log('\nRun checkLocalStorage() to get started!\n');

// Auto-run on load
checkLocalStorage();
checkStateAge();