const API_URL = 'http://localhost:5000/api';

function extractCookies(responseHeaders) {
  const cookies = [];
  const setCookie = responseHeaders.getSetCookie();
  for (const cookieStr of setCookie) {
    const parts = cookieStr.split(';');
    cookies.push(parts[0]);
  }
  return cookies.join('; ');
}

async function runTests() {
  try {
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@yourdomain.com',
        password: 'ChangeThisToAStrongPassword123!'
      })
    });
    
    if (loginRes.status !== 200) {
      throw new Error(`Admin login failed: ${await loginRes.text()}`);
    }
    
    const loginData = await loginRes.json();
    console.log('Admin Login Success:', loginData.user.email, 'Role:', loginData.user.role);
    
    const adminCookies = extractCookies(loginRes.headers);

    console.log('\n2. Fetching Admin Dashboard Analytics...');
    const statsRes = await fetch(`${API_URL}/admin/analytics`, {
      headers: { 'Cookie': adminCookies }
    });
    const statsData = await statsRes.json();
    console.log('Admin Analytics Counts:', statsData.analytics.counts);

    console.log('\n3. Fetching Admin Users list...');
    const usersRes = await fetch(`${API_URL}/admin/users`, {
      headers: { 'Cookie': adminCookies }
    });
    const usersData = await usersRes.json();
    console.log('Total Users:', usersData.users.length);

    // Let's find one user to test ban (e.g. the first non-admin user)
    const testUser = usersData.users.find(u => u.role !== 'admin');
    if (testUser) {
      console.log(`\n4. Banning user: ${testUser.email} (ID: ${testUser._id})...`);
      const banRes = await fetch(`${API_URL}/admin/users/${testUser._id}/ban`, {
        method: 'PUT',
        headers: { 'Cookie': adminCookies }
      });
      const banData = await banRes.json();
      console.log('Ban response:', banData);
      
      console.log(`Unbanning user: ${testUser.email} (ID: ${testUser._id})...`);
      const unbanRes = await fetch(`${API_URL}/admin/users/${testUser._id}/ban`, {
        method: 'PUT',
        headers: { 'Cookie': adminCookies }
      });
      const unbanData = await unbanRes.json();
      console.log('Unban response:', unbanData);
    } else {
      console.log('\nNo test user found to test ban.');
    }

    // Moderate a comment if any exists in recentComments
    const recentComment = statsData.analytics.recentComments?.[0];
    if (recentComment) {
      console.log(`\n5. Moderating comment (ID: ${recentComment._id}) to toggle visibility...`);
      const hideRes = await fetch(`${API_URL}/admin/comments/${recentComment._id}/hide`, {
        method: 'PUT',
        headers: { 'Cookie': adminCookies }
      });
      const hideData = await hideRes.json();
      console.log('Hide comment response:', hideData);
    } else {
      console.log('\nNo recent comments found to test moderation.');
    }

    console.log('\nAdmin API tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();
