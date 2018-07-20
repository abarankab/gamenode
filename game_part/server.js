var app = require('express')();

var server = require('http').Server(app);

var io = require('socket.io')(server);

var cookie = require('cookie');

server.listen(3000);

var height = 100;
var len = 100;
var game = [];
var row = [];

var users= [
];


var new_id = 10;

var game_on = false;
app.get('/', function(request, response){
  let id = -1;
  let  user = false;
  for(let j = 0; j<users.length; j++){
    if(typeof cookie.parse(request.headers.cookie)['snak3r'] !== 'undefined')
    if(users[j]['cookie'] == cookie.parse(request.headers.cookie)['snak3r']){
      user = true;
      break;
    }
  }
  if (new_id<=20 && !game_on && !user){
    var randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    response.cookie('snak3r',randomNumber, { maxAge: 900000, httpOnly: true });
    id = new_id;
    new_id +=1;
    users.push({id: id, cookie : randomNumber, lastButtons: '', snake:[]});
  }
  response.sendFile(__dirname + "/index.html");
});


//send_id
app.get('/id', function(request, response){
  for(let j = 0; j<users.length; j++){
    if(typeof cookie.parse(request.headers.cookie)['snak3r'] !== 'undefined')
    if(users[j]['cookie'] == cookie.parse(request.headers.cookie)['snak3r']){
      response.header('Content-type','application/json');
	    response.header('Charset','utf8');
	    response.send(JSON.stringify(users[j]['id']));

      break;
    }
}
});

io.on('connection', function(socket){
  socket.on('user.pushButton', function(button){
    for(let i = 0; i<users.length; i++){
      if(typeof cookie.parse(socket.request.headers.cookie)['snak3r'] !== 'undefined')
      if(users[i]['cookie'] == cookie.parse(socket.request.headers.cookie)['snak3r']){
        users[i]['lastButtons'] += button;
      }
    }
  });
});


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

//some function for game logic
function find_tail(pos, last_pos, i)
{
  if(i<5000){
  id = game[pos[0]][pos[1]].slice(1);
  if(pos[0]-1>=0 && (pos[0]-1!=last_pos[0]))
    if(game[pos[0]-1][pos[1]] == '0' + id)
      return find_tail([pos[0]-1,pos[1]], pos, i+1)
  if(pos[0]+1<game.length && (pos[0]+1!=last_pos[0]))
    if(game[pos[0]+1][pos[1]] == '0' +  id)
      return find_tail([pos[0]+1,pos[1]], pos, i+1)
  if(pos[1]-1>=0 && (pos[1]-1!=last_pos[1]))
    if(game[pos[0]][pos[1]-1] == '0' + id)
      return find_tail([pos[0],pos[1]-1], pos, i+1)
  if(pos[1]+1<game[0].length && (pos[1]+1!=last_pos[1]))
    if(game[pos[0]][pos[1]+1] == '0' + id)
      return find_tail([pos[0],pos[1]+1], pos, i+1)
  }
  return pos
}

function death(pos)
{
  id = game[pos[0]][pos[1]].slice(1);
  if(game[pos[0]][pos[1]][0] == '0')
  {
    if(getRandomInt(2) == 1)
      game[pos[0]][pos[1]] = '2';
    else
      game[pos[0]][pos[1]] = '0';
  }
  else
    game[pos[0]][pos[1]] = '1' + game[pos[0]][pos[1]].slice(1);

  if(pos[0]-1>=0)
    if(game[pos[0]-1][pos[1]].slice(1) == id)
      death([pos[0]-1,pos[1]])
  if(pos[0]+1<game.length)
    if(game[pos[0]+1][pos[1]].slice(1) == id)
      death([pos[0]+1,pos[1]])
  if(pos[1]-1>=0)
    if(game[pos[0]][pos[1]-1].slice(1) == id)
      death([pos[0],pos[1]-1])
  if(pos[1]+1<game[0].length)
    if(game[pos[0]][pos[1]+1].slice(1) == id)
      death([pos[0],pos[1]+1])
}

function print(){
    var str;
    for(let i = 0; i< game.length; i++ ){
      str = '';
      for(let j = 0; j< game[0].length; j++ )
        if(game[i][j].length == 1)
          str += '00' + game[i][j] + ' '
        else
          str += game[i][j] + ' '
      console.log(str);
  }
  console.log('--------------------')
}

var dead = [];
var game_id = 0;
var time_max = 1000;
var food = 500;
var users_start = 2;
var users_end = 1;

setInterval(function(){
if(users.length >= users_start && !game_on)
{

  game = [];
  //empty field
  for(let j =0; j< height; j++){
    row = [];
    for(let k = 0; k< len; k++)
      row.push('0');
    game.push(row);
  }
  //generate position of food/players

  for(let i =0; i< users.length; i++)
    for(let j = 0; j< 1000; j++){
      let [y1, x1]= [getRandomInt(game.length), getRandomInt(game[0].length)];
      if(y1+1<game.length && y1-1>=0)
        if(game[y1][x1] == '0' && game[y1-1][x1] == '0' && game[y1+1][x1] == '0'){
          game[y1][x1]   = '1' + users[i]['id'].toString();
          game[y1+1][x1] = '0' + users[i]['id'].toString();
          users[i]['snake'] = [[y1+1,x1],[y1,x1]];
          break;
        }
  }
  //generate food
  for(let k =0; k<food; k++)
    for(let j = 0; j< 1000; j++){
      let [y1, x1]= [getRandomInt(game.length), getRandomInt(game[0].length)];
      if(game[y1][x1] == '0'){
        game[y1][x1] = '1';
        break;
      }
    }

game_on = true;
game_id = setInterval(function(){
  // gamelogic

  //for each player
  for(let i = 0; i< users.length; i++){
    var move = [0, 0];
      switch(users[i]['lastButtons'][users[i]['lastButtons'].length-1]){
        case 'w':
          move[0]-=1;
          break;
        case 's':
          move[0]+=1;
          break;
        case 'a':
          move[1]-=1;
          break;
        case 'd':
          move[1]+=1;
          break;
      }
    if(move[0] == 0 && move[1] == 0)
      move = [-1, 0];
    var [y,x] = users[i]['snake'][users[i]['snake'].length-1];
    let found = false;
    //can move
    if(y+move[0] >= 0 && y+move[0] < game.length && x+move[1] >= 0 && x+move[1] < game[0].length){
      if(users[i]['snake'][users[i]['snake'].length-2][0] == y+move[0] && users[i]['snake'][users[i]['snake'].length-2][1] == x+move[1]){
          move[0] = -move[0];
          move[1] = -move[1];
      }
      if(game[y+move[0]][x+move[1]].length == 1){
        //slice tail
        if(game[y+move[0]][x+move[1]] != '1' && game[y+move[0]][x+move[1]] != '2'){
          let [y1, x1] = users[i]['snake'].splice(0,1)[0];
          game[y1][x1] = '0';
        }
        //generate more food
        if(game[y+move[0]][x+move[1]] == '1'){
          for(let j = 0; j< 1000; j++){
            let [y1, x1]= [getRandomInt(game.length), getRandomInt(game[0].length)];
            if(game[y1][x1] == '0'){
              game[y1][x1] = '1';
              break;
            }
          }
        }
        if(move[0] == -1 && move[1] == 0)
            game[y+move[0]][x+move[1]] = '1' + game[y][x].slice(1);
        else if(move[0] == 1 && move[1] == 0)
            game[y+move[0]][x+move[1]] = '3' + game[y][x].slice(1);
        else if(move[0] == 0 && move[1] == 1)
            game[y+move[0]][x+move[1]] = '2' + game[y][x].slice(1);
        else if(move[0] == 0 && move[1] == -1)
            game[y+move[0]][x+move[1]] = '4' + game[y][x].slice(1);
        users[i]['snake'].push([y+move[0], x+move[1]])
        game[y][x] = '0' + game[y][x].slice(1);
      }
      else{
        dead.push(i);
        death([y, x]);
      }
    }
    else{
      dead.push(i);
      death([y, x]);
    }
  }
  while(dead.length > 0){
    users.splice(dead[0], 1);
    dead.splice(0, 1);
    for(let k = 0; k< dead.length;k++)
      dead[k]-=1;
  }
  var ter = {};
  ter["map"] = game;
  ter["h"] = game.length;
  ter["w"] = game[0].length;
  ter["color"] = {
  "10": "black",
  "11": "blue",
  "12": "#778899",
  "13": "#6495ED",
  "14": "#40E0D0",
  "15": "#7FFF00",
  "16": "#EEE8AA",
  "17": "#CD5C5C",
  "18": "#FFB6C1",
  "19": "#9400D3",
  "20": "#90EE90",
};

  io.emit('map.update', JSON.stringify(ter));
  if(users.length == users_end)
  {
    clearInterval(game_id);
    new_id = 10;
    game_on = false;
    users = [];
  }
}, 200);
}}, time_max);
