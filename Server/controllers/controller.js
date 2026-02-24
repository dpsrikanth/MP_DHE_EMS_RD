const express = require('express');

const getUserData = (req, res) => {
    // Sample data to send back to the client
    const userData = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com'
    };
    res.json(userData);
};

module.exports = { getUserData };