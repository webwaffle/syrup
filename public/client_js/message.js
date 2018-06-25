function sendData(data) {
    var XHR = new XMLHttpRequest();
    var urlEncodedData = "";
    var urlEncodedDataPairs = [];
    var name;
    for(name in data) {
        urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
    }
    
    urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
    /*urlEncodedData = urlEncodedData + '&chatid=' + chatid;
    XHR.addEventListener('load', function(event) {
        alert('Response loaded');
    });
    XHR.addEventListener('error', function(event) {
        alert('Oops! Something goes wrong.');
    });*/
    XHR.open('POST', '/message-process');

    XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    XHR.send(urlEncodedData);
}
document.getElementById('message-send').addEventListener('click', function() {
    var messageToSend = document.getElementById('message').value;
    sendData({message: messageToSend, chatid: chatid, from: username});
});


function getMessages() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            var messages = JSON.parse(this.responseText);
            document.getElementById('messages').innerHTML = "";
            for (var i = 0; i < messages.length; i++) {
                if (messages[i].from.username) {
                    userfrom = messages[i].from.username;
                } else {
                    userfrom = document.getElementById('creator').innerHTML.slice(11);
                }
                if (messages[i].mine) {
                    document.getElementById('messages').innerHTML += '<div class="message-mine"><p class="message-body">' + messages[i].message + '</p></div> <br><br><br>';
                } else {
                    document.getElementById('messages').innerHTML += '<div class="message-notmine"><p class="message-body">' + messages[i].message + '</p></div><br><p class="message-sender">from ' + userfrom  + '</p> <br><br><br>';
                }
            }
            //console.log(this.responseText);
        }
    }
    req.open('GET', '/message-api?id=' + chatid + '&username=' + username + 'nocache=' + Date().toLocaleString(), true);
    req.send();
}
getMessages();
setInterval(function() {
    getMessages();
}, 2000);