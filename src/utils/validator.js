function validateLink(link) {
    const urlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
    return urlPattern.test(link);
}

module.exports = validateLink;