var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var fs = require('fs');
var moment = require('moment');
var handlebars = require('express3-handlebars').create({
    defaultLayout: 'main'
});

var app = express();
app.use(express.static(__dirname + '/public'));
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
var options = {
    secret: 'yee',
    resave: false,
    saveUninitialized: false,
    store: new FileStore,
    cookie: {
        maxAge: 3600000,
        secure: false,
        httpOnly: true
    },
    name: 'my.connect.sid'
}
app.use(session(options));

app.set('port', process.env.PORT || 3000);

function fileToJson(path) {
    return JSON.parse(fs.readFileSync(path))
}

function deleteFromArray(array, item) {
    var index = array.indexOf(item);
    if (index > -1) {
        return array.splice(index, 1)
    }
}
/*function setChatRoutes() {
    var chatArray = fileToJson('data/chats.json');
    console.log(chatArray);
    chatArray.forEach(function(c) {
        
    });
}*/


app.get('/home', function (req, res) {
    var ownedChats = [];
    var joinedChats = [];
    var chatArray = fileToJson('data/chats.json')
    chatArray.forEach(function (c) {
        if (c.creator == req.session.username) {
            ownedChats.push(c);
        } else {
            for (var i = 0; i < c.members.length; i++) {
                if (c.members[i].id == req.session.userid && c.members[i].username == req.session.username) {
                    var banArray = fileToJson('data/bans.json');
                    for(var x = 0; x < banArray.length; x++) {
                        if(banArray[x].chatid == c.id && banArray[x].username == req.session.username) {
                            var banned = true;
                        }
                    }
                    if (!banned) {
                        joinedChats.push(c);
                    }
                }
            }
           
        }
    });
    var args = {
        username: req.session.username,
        ownedChats: ownedChats,
        joinedChats: joinedChats
    };
    res.render('home/home', args);
});

app.get('/chat', function (req, res) {
    var chatArray = fileToJson('data/chats.json');
    var myChats = [];
    for (var i = 0; i < chatArray.length; i++) {
        chatArray[i].members.forEach(function (c) {
            if (c.username == req.session.username && c.id == req.session.userid) {
                myChats.push(chatArray[i]);
            }
        });
        if (chatArray[i].creator == req.session.username) {
            myChats.push(chatArray[i]);
        }
    }
    chatArray.forEach(function (c) {
        if (req.query.id == c.id) {
            var chat = c;
            //break;
            args = {
                name: c.name,
                id: c.id,
                username: req.session.username,
                creator: c.creator,
                chats: myChats,
                admin: c.creator == req.session.username
            };
            //console.log(args);
        }
    });
    res.render('home/chat', args);
});

app.get('/message-api', function (req, res) {
    var chatArray = fileToJson('data/chats.json');
    for (var i = 0; i < chatArray.length; i++) {
        if (chatArray[i].id == req.query.id) {
            var chat = chatArray[i];
        }
    }
    for (var i = 0; i < chat.messages.length; i++) {
        if (chat.messages[i].from.username == req.session.username && chat.messages[i].from.id == req.session.userid) {
            chat.messages[i].mine = true;
        } else {
            chat.messages[i].mine = false;
        }
    }
    res.type('application/json');
    res.send(JSON.stringify(chat.messages));
});

app.post('/message-process', function (req, res) {
    //console.log(req.body.message);
    //console.log(req.body.chatid);
    var chatArray = fileToJson('data/chats.json');
    for (var i = 0; i < chatArray.length; i++) {
        if (chatArray[i].id == req.body.chatid) {
            chatArray[i].messages.push({
                message: req.body.message,
                from: {
                    id: req.session.userid,
                    username: req.session.username
                },
                sent: moment().format('MM-DD-YYYY h:mm:ss a')
            })
        }
    }
    fs.writeFileSync('data/chats.json', JSON.stringify(chatArray, undefined, 2));
    res.render('filler');
});



app.get('/', function (req, res) {
    res.render('users/login');
});
app.post('/login-process', function (req, res) {
    var userArray = fileToJson('data/users.json');
    userArray.forEach(function (e) {
        if (e.username == req.body.username) {
            if (e.password == req.body.password) {
                req.session.username = req.body.username;
                req.session.userid = e.id;
                res.redirect(303, '/home');
            } else {
                res.render('users/pass-wrong', {
                    user: req.body.username,
                    pass: req.body.password
                });
            }
        }
    });
});

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.clearCookie(options.name);
        }
    });
    res.render('users/logout');
});

app.get('/create-user', function (req, res) {
    res.render('users/create');
});
app.post('/create-user-process', function (req, res) {
    var userArray = fileToJson('data/users.json')
    if (userArray.length > 0) {
        var toId = userArray.reverse()[0].id + 1;
    } else {
        var toId = 0;
    }
    userArray.push({
        id: toId,
        username: req.body.username,
        password: req.body.password,
        creation_datetime: moment().format('MM-DD-YYYY h:mm:ss a')
    });
    fs.writeFileSync('data/users.json', JSON.stringify(userArray, undefined, 2));
    res.redirect(303, '/');
});


app.post('/create-chat-process', function (req, res) {
    var chatArray = fileToJson('data/chats.json');
    if (chatArray.length > 0) {
        var toId = chatArray.reverse()[0].id + 1;
    } else {
        var toId = 0;
    }
    chatArray.push({
        id: toId,
        name: req.body.name,
        creator: req.session.username,
        creator_id: req.session.userid,
        creation_datetime: moment().format('MM-DD-YYYY h:mm:ss a'),
        members: [],
        messages: []
    });
    fs.writeFileSync('data/chats.json', JSON.stringify(chatArray, undefined, 2));
    res.redirect(303, '/home');
});

app.post('/join-chat-process', function (req, res) {
    var chatArray = fileToJson('data/chats.json');
    for (var i = 0; i < chatArray.length; i++) {
        if (chatArray[i].id == req.body.join_id) {
            //console.log('yee');
            chatArray[i].members.push({
                id: req.session.userid,
                username: req.session.username
            })
        }
    }
    fs.writeFileSync('data/chats.json', JSON.stringify(chatArray, undefined, 2));
    res.redirect(303, '/home');
    //res.render('filler');
});
app.post('/ban-process', function (req, res) {
    //Ban processor, takes body.user and query.chatid
    var banArray = fileToJson('data/bans.json');
    banArray.push({
        chatid: req.query.chatid,
        username: req.body.user
    });
    fs.writeFileSync('data/bans.json', JSON.stringify(banArray, undefined, 2));
    res.redirect(303, '/chat?id=' + req.query.chatid);
});
app.get('/moment.js', function(req, res) {
    res.type('application/javascript');
    res.send(fs.readFileSync('node_modules/moment/moment.js'));
});


app.use(function (req, res, next) {
    res.type('text/plain');
    res.status(404);
    res.send('error 404, lol dis no exist');
});

app.listen(app.get('port'), function () {
    console.log("Started");
});
