function sendData(data) {
    var XHR = new XMLHttpRequest();
    var urlEncodedData = "";
    var urlEncodedDataPairs = [];
    var name;
    for(name in data) {
        urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
    }
    
    urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
    //urlEncodedData = urlEncodedData + '&chatid=' + chatid;
    /*XHR.addEventListener('load', function(event) {
        alert('Response loaded');
    });*/
    XHR.addEventListener('error', function(event) {
        alert('Oops! Something goes wrong.');
    });
    XHR.open('POST', '/message-process');

    XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    XHR.send(urlEncodedData);
}
document.getElementById('message-send').addEventListener('click', function() {
    var messageToSend = document.getElementById('message').value;
    sendData({message: messageToSend, chatid: chatid, from: username});
});

Vue.component('message', {
    props: ['message', 'ismine'],
    template: '<div class="message"><p class="message-body">{{ message }}</p></div>'
});

var app = new Vue({
    el: '#messages',
    data: {
        messages: [
            
        ]
    }
});


function getMessages(id) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            app.messages = JSON.parse(this.responseText);
        }
    }
    req.open('GET', '/message-api?id=' + chatid + '&username=' + username, true);
    req.send();
}