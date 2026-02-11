// Level Up - Analytics Module
// Handles chart rendering and data visualization

(function() {
    'use strict';

    // Initialize window.LevelUp namespace if not exists
    window.LevelUp = window.LevelUp || {};

    // ===== HELPER FUNCTIONS =====
    
    /**
     * Draw a bar chart on the given canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string[]} labels - Array of labels for each bar
     * @param {number[]} data - Array of data values for each bar
     */
    function drawBarChart(ctx, width, height, labels, data) {
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const barWidth = chartWidth / data.length / 1.5;
        const maxValue = Math.max(...data, 1);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        
        data.forEach((value, i) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + (chartWidth / data.length) * i + (chartWidth / data.length - barWidth) / 2;
            const y = height - padding - barHeight;
            
            const gradient = ctx.createLinearGradient(x, y, x, height - padding);
            gradient.addColorStop(0, '#a463f2');
            gradient.addColorStop(1, '#ff6b6b');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x + barWidth / 2, height - padding + 20);
            ctx.fillText(value, x + barWidth / 2, y - 5);
        });
    }

    // ===== CHART RENDERING FUNCTIONS =====

    /**
     * Main function to render all charts
     */
    function renderCharts() {
        renderWeeklyProgressChart();
        renderStatsRadarChart();
        renderMonthlyCompletionChart();
        renderXPOverTimeChart();
        renderDailyXPBreakdownChart();
        renderStatGrowthChart();
    }

    /**
     * Render weekly progress chart showing quest completions for the last 7 days
     */
    function renderWeeklyProgressChart() {
        const canvas = document.getElementById('weeklyChart');
        if (!canvas) return;
        
        const user = allUsers[currentUser];
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        
        ctx.clearRect(0, 0, width, height);
        
        const days = [];
        const completions = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            const count = Object.keys(user.completions).filter(k => k.includes(key)).length;
            days.push(date.toLocaleDateString('en', { weekday: 'short' }));
            completions.push(count);
        }
        
        drawBarChart(ctx, width, height, days, completions);
    }

    /**
     * Render stats radar chart showing all five stats
     */
    function renderStatsRadarChart() {
        const canvas = document.getElementById('statsRadar');
        if (!canvas) return;
        
        const user = allUsers[currentUser];
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        
        ctx.clearRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        
        const stats = [
            { name: 'STR', value: user.stats.strength, color: '#ef4444' },
            { name: 'DIS', value: user.stats.discipline, color: '#3b82f6' },
            { name: 'FOC', value: user.stats.focus, color: '#8b5cf6' },
            { name: 'VIT', value: user.stats.vitality, color: '#10b981' },
            { name: 'WIS', value: user.stats.wisdom, color: '#f59e0b' }
        ];
        
        const angleStep = (Math.PI * 2) / stats.length;
        const cap = window.getStatCap();
        
        // Draw background grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            const r = (radius / 5) * i;
            stats.forEach((_, index) => {
                const angle = angleStep * index - Math.PI / 2;
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
        }
        
        // Draw axes and labels
        stats.forEach((stat, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.stroke();
            
            const labelX = centerX + Math.cos(angle) * (radius + 20);
            const labelY = centerY + Math.sin(angle) * (radius + 20);
            ctx.fillStyle = stat.color;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(stat.name, labelX, labelY);
        });
        
        // Draw stat values
        ctx.beginPath();
        stats.forEach((stat, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const value = (Math.min(stat.value, cap) / cap) * radius;
            const x = centerX + Math.cos(angle) * value;
            const y = centerY + Math.sin(angle) * value;
            
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(168, 99, 242, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#a463f2';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Render monthly completion chart showing quest completions for each month
     */
    function renderMonthlyCompletionChart() {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;
        
        const user = allUsers[currentUser];
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        
        ctx.clearRect(0, 0, width, height);
        
        const monthlyData = [];
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const currentYear = new Date().getFullYear();
        for (let month = 0; month < 12; month++) {
            const monthKey = new Date(currentYear, month).toISOString().slice(0, 7);
            const count = Object.keys(user.completions).filter(k => k.includes(monthKey)).length;
            monthlyData.push(count);
        }
        
        drawBarChart(ctx, width, height, labels, monthlyData);
    }

    /**
     * Render XP over time chart showing XP earned over the last 30 days
     */
    function renderXPOverTimeChart() {
        const canvas = document.getElementById('xpChart');
        if (!canvas) return;
        
        const user = allUsers[currentUser];
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        
        ctx.clearRect(0, 0, width, height);
        
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        const xpHistory = [];
        for (let i = 0; i <= 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (30 - i));
            const key = date.toISOString().split('T')[0];
            const dailyXP = Object.keys(user.completions).filter(k => k.includes(key)).reduce((sum, k) => {
                const questId = k.split('-')[0];
                const quest = user.quests.find(q => q.id === questId);
                return sum + (quest ? quest.xp : 0);
            }, 0);
            xpHistory.push(dailyXP);
        }
        
        const maxXP = Math.max(...xpHistory, 1);
        
        // Draw line
        ctx.strokeStyle = '#a463f2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        xpHistory.forEach((xp, i) => {
            const x = padding + (chartWidth / 30) * i;
            const y = height - padding - (xp / maxXP) * chartHeight;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Fill area under line
        ctx.fillStyle = 'rgba(164, 99, 242, 0.1)';
        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Render daily XP breakdown chart showing XP earned for the last 7 days
     */
    function renderDailyXPBreakdownChart() {
        const canvas = document.getElementById('dailyXPChart');
        if (!canvas) return;
        
        const user = allUsers[currentUser];
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        
        ctx.clearRect(0, 0, width, height);
        
        const days = [];
        const xpData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            const dailyXP = Object.keys(user.completions).filter(k => k.includes(key)).reduce((sum, k) => {
                const questId = k.split('-')[0];
                const quest = user.quests.find(q => q.id === questId);
                return sum + (quest ? quest.xp : 0);
            }, 0);
            days.push(date.toLocaleDateString('en', { weekday: 'short' }));
            xpData.push(dailyXP);
        }
        
        drawBarChart(ctx, width, height, days, xpData);
    }

    /**
     * Render stat growth chart showing current values of all stats
     */
    function renderStatGrowthChart() {
        const canvas = document.getElementById('statGrowthChart');
        if (!canvas) return;
        
        const user = allUsers[currentUser];
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        
        ctx.clearRect(0, 0, width, height);
        
        const statNames = ['Strength', 'Discipline', 'Focus', 'Vitality', 'Wisdom'];
        const statKeys = ['strength', 'discipline', 'focus', 'vitality', 'wisdom'];
        const statValues = statKeys.map(k => user.stats[k]);
        
        drawBarChart(ctx, width, height, statNames, statValues);
    }

    // ===== EXPORTS =====
    // Export to window.LevelUp namespace
    window.LevelUp.analytics = {
        renderCharts,
        renderWeeklyProgressChart,
        renderMonthlyCompletionChart,
        renderXPOverTimeChart,
        renderDailyXPBreakdownChart,
        renderStatsRadarChart,
        renderStatGrowthChart,
        drawBarChart
    };

    // Also export directly to window for backward compatibility (using original function names)
    window.renderCharts = renderCharts;
    window.renderWeeklyChart = renderWeeklyProgressChart;
    window.renderMonthlyChart = renderMonthlyCompletionChart;
    window.renderXPChart = renderXPOverTimeChart;
    window.renderDailyXPChart = renderDailyXPBreakdownChart;
    window.renderStatsRadar = renderStatsRadarChart;
    window.renderStatGrowthChart = renderStatGrowthChart;

})();
