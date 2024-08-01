function timeStampPrint() {
    // current timestamp in milliseconds
    let ts = Date.now();

    let date_time = new Date(ts);
    let date = date_time.getDate();
    let month = date_time.getMonth() + 1;
    let year = date_time.getFullYear();
    let hour = date_time.getHours();
    let minute = date_time.getMinutes();
    let seconds = date_time.getSeconds();
    let timestmp = year+'-'+ month+'-'+ date+' '+ hour+':'+ minute +':'+ seconds;
    return timestmp;
}

module.exports = {
    timeStampPrint,
}