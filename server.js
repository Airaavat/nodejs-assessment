const express = require('express');
const moment = require('moment');
const _ = require('lodash');

const app = express();
app.use(express.json());

let departments = {};
let books = {};

const downloadLogs = {
    daily: [],
    weekly: [],
    monthly: []
};

// Utility function to update rankings
const updateRankings = () => {
    // Update department rankings
    const departmentDownloads = _.countBy(downloadLogs.daily, 'department');
    const sortedDepartments = Object.keys(departmentDownloads).sort((a, b) => departmentDownloads[b] - departmentDownloads[a]);

    departments = sortedDepartments.slice(0, 5);

    // Update book rankings
    const bookDownloads = _.countBy(downloadLogs.daily, 'isbn');
    const sortedBooks = Object.keys(bookDownloads).sort((a, b) => bookDownloads[b] - bookDownloads[a]);

    books.todayTrending = sortedBooks.slice(0, 5);

    const weeklyBookDownloads = _.countBy(downloadLogs.weekly, 'isbn');
    const sortedWeeklyBooks = Object.keys(weeklyBookDownloads).sort((a, b) => weeklyBookDownloads[b] - weeklyBookDownloads[a]);

    books.weeklyPopular = sortedWeeklyBooks.slice(0, 5);

    const monthlyBookDownloads = _.countBy(downloadLogs.monthly, 'isbn');
    const sortedMonthlyBooks = Object.keys(monthlyBookDownloads).sort((a, b) => monthlyBookDownloads[b] - monthlyBookDownloads[a]);

    books.monthlyPopular = sortedMonthlyBooks.slice(0, 5);
};

// Daily task to update rankings and clear daily logs
setInterval(() => {
    updateRankings();
    downloadLogs.daily = [];
}, 24 * 60 * 60 * 1000); // Every 24 hours

// Weekly task to remove least popular books
setInterval(() => {
    const bookDownloads = _.countBy(downloadLogs.weekly, 'isbn');
    const leastPopularBooks = Object.keys(bookDownloads).sort((a, b) => bookDownloads[a] - bookDownloads[b]);

    leastPopularBooks.slice(0, 5).forEach(isbn => {
        const leastPopularBookLogs = downloadLogs.weekly.filter(log => log.isbn === isbn);
        if (leastPopularBookLogs.length === 0) {
            delete books[isbn];
        }
    });

    downloadLogs.weekly = [];
}, 7 * 24 * 60 * 60 * 1000); // Every week

// Monthly task to clear monthly logs
setInterval(() => {
    downloadLogs.monthly = [];
}, 30 * 24 * 60 * 60 * 1000); // Every month

// Endpoints

// Endpoint to download a book
app.post('/download', (req, res) => {
    const { isbn, department } = req.body;

    const downloadEntry = { isbn, department, timestamp: moment().toISOString() };
    downloadLogs.daily.push(downloadEntry);
    downloadLogs.weekly.push(downloadEntry);
    downloadLogs.monthly.push(downloadEntry);

    res.send('Download logged');
});

// Endpoint to get current rankings
app.get('/rankings', (req, res) => {
    res.json({
        popularDepartments: departments,
        books
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});