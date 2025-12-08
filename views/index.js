  const API_URL = 'http://localhost:3000/api';

        // Check login status on page load
        async function checkLoginStatus() {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    showLoggedInUser(data.user);
                    // Show main content, hide login screen
                    document.getElementById('loginRequired').style.display = 'none';
                    document.getElementById('mainContent').style.display = 'block';
                    // Auto-load rankings
                    loadRankings();
                } else {
                    // Not authenticated - show login screen
                    document.getElementById('loginRequired').style.display = 'flex';
                    document.getElementById('mainContent').style.display = 'none';
                }
            } catch (error) {
                console.log('Not logged in');
                document.getElementById('loginRequired').style.display = 'flex';
                document.getElementById('mainContent').style.display = 'none';
            }
        }

        // Show logged in user info
        function showLoggedInUser(user) {
            const userInfo = document.getElementById('userInfo');
            const linkCodeforcesCard = document.getElementById('linkCodeforcesCard');
            
            // Show 42 user info with clickable profile link
            userInfo.innerHTML = `
                <img src="${user.intraAvatar || user.avatar || 'https://via.placeholder.com/40'}" alt="${user.intraLogin}">
                <a href="https://profile.intra.42.fr/users/${user.intraLogin}" target="_blank" style="font-weight: 600; text-decoration: none; color: inherit;">${user.intraLogin}</a>
                ${user.codeforcesHandle ? `<span style="margin-left: 10px;">🔗 CF: ${user.codeforcesHandle} (${user.codeforcesRating})</span>` : ''}
            `;
            userInfo.style.display = 'flex';
            
            // If Codeforces is linked, hide the link button
            if (user.codeforcesHandle) {
                linkCodeforcesCard.querySelector('.btn-oauth').style.display = 'none';
            }
        }

        // Login with 42
        function loginWith42() {
            window.location.href = `${API_URL}/auth/42/login`;
        }

        // Login with Codeforces (linking account)
        function loginWithCodeforces() {
            window.location.href = `${API_URL}/auth/codeforces`;
        }

        // Logout
        async function logout() {
            try {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
                window.location.reload();
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        // Check for OAuth redirect messages
        function checkOAuthStatus() {
            const urlParams = new URLSearchParams(window.location.search);
            const login = urlParams.get('login');
            const user = urlParams.get('user');
            const error = urlParams.get('error');

            if (login === 'success' && user) {
                const messageEl = document.getElementById('addMessage');
                if (messageEl) {
                    showMessage(messageEl, `✅ Successfully logged in as ${user}!`, 'success');
                }
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                checkLoginStatus();
            } else if (error) {
                const messageEl = document.getElementById('addMessage');
                if (messageEl) {
                    showMessage(messageEl, `❌ ${error}`, 'error');
                }
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }

        // Load rankings function
        async function loadRankings() {
            const loading = document.getElementById('loading');
            const noData = document.getElementById('noData');
            const table = document.getElementById('rankingsTable');
            const stats = document.getElementById('stats');
            const messageEl = document.getElementById('rankingMessage');

            loading.classList.add('active');
            noData.style.display = 'none';
            table.style.display = 'none';
            stats.style.display = 'none';
            messageEl.style.display = 'none';

            try {
                const response = await fetch(`${API_URL}/rankings`);
                const data = await response.json();

                loading.classList.remove('active');

                if (data.rankings && data.rankings.length > 0) {
                    displayRankings(data.rankings);
                    displayStats(data);
                    showMessage(messageEl, `✅ ${data.message}`, 'success');
                } else {
                    noData.style.display = 'block';
                }
            } catch (error) {
                loading.classList.remove('active');
                showMessage(messageEl, `❌ Error loading rankings: ${error.message}`, 'error');
            }
        }

        // Display rankings in table
        function displayRankings(rankings) {
            const tbody = document.getElementById('rankingsBody');
            tbody.innerHTML = '';

            rankings.forEach(user => {
                const row = document.createElement('tr');
                
                const positionClass = user.position <= 3 ? `position-${user.position}` : '';
                const rankClass = getRankClass(user.rank);
                const avatarUrl = user.codeforcesAvatar || 'https://via.placeholder.com/30';
                
                row.innerHTML = `
                    <td><span class="position ${positionClass}">#${user.position}</span></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="${avatarUrl}" alt="${user.handle}" style="width: 30px; height: 30px; border-radius: 50%;">
                            <a href="https://codeforces.com/profile/${user.handle}" target="_blank" style="font-weight: 600; text-decoration: none; color: inherit;">
                                ${user.handle}
                            </a>
                        </div>
                    </td>
                    <td>
                        <a href="https://profile.intra.42.fr/users/${user.intraLogin}" target="_blank" style="font-weight: 600; text-decoration: none; color: inherit;">
                            ${user.intraLogin || '-'}
                        </a>
                    </td>
                    <td>${user.name || '-'}</td>
                    <td><span class="rating">${user.rating}</span></td>
                    <td><span class="rank-badge ${rankClass}">${user.rank}</span></td>
                    <td>${user.maxRating}</td>
                    <td>${user.country || '-'}</td>
                `;
                
                tbody.appendChild(row);
            });

            document.getElementById('rankingsTable').style.display = 'table';
        }

        // Display statistics
        function displayStats(data) {
            const avgRating = data.rankings.length > 0
                ? Math.round(data.rankings.reduce((sum, u) => sum + u.rating, 0) / data.rankings.length)
                : 0;

            document.getElementById('totalUsers').textContent = data.totalUsers;
            document.getElementById('avgRating').textContent = avgRating;
            document.getElementById('stats').style.display = 'flex';
        }

        // Get rank CSS class
        function getRankClass(rank) {
            if (!rank) return 'rank-unrated';
            const rankLower = rank.toLowerCase();
            if (rankLower.includes('legendary')) return 'rank-legendary';
            if (rankLower.includes('grandmaster')) return 'rank-grandmaster';
            if (rankLower.includes('master')) return 'rank-master';
            if (rankLower.includes('candidate')) return 'rank-candidate';
            if (rankLower.includes('expert')) return 'rank-expert';
            if (rankLower.includes('specialist')) return 'rank-specialist';
            if (rankLower.includes('pupil')) return 'rank-pupil';
            if (rankLower.includes('newbie')) return 'rank-newbie';
            return 'rank-unrated';
        }

        // Show message helper
        function showMessage(element, message, type) {
            element.textContent = message;
            element.className = `message ${type}`;
            element.style.display = 'block';
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }

        // Load rankings on page load
        window.addEventListener('load', () => {
            checkLoginStatus();
            checkOAuthStatus();
        });