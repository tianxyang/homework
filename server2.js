const http=require('http');
const fs=require('fs');
const mysql=require('mysql');
const io=require('socket.io');
const regs=require('./libs/regs');
//数据库
let db = mysql.createPool({host:'localhost',username:'root',password:'123456',database:'user'});
//HTTP服务
let server = http.createServer(req,res)=>{
  fs.readFile(`www${req.url}`,(err,data)=>{
    if(err){
      res.writeHeader(404);
      res.write('Not Found');
    }else{
      res.write(data);
    }
    res.end();
  });
});
server.listen(8801);
//websocket服务
let oSock = [];
let wsServer = io.listen(server);
wsServer.on('connection',sock=>{
  oSock.push(sock);
  //注册
  sock.on('reg',(user,pass)=>{
    if(!regs.username.test(user)){
      sock.emit('reg_ret', 1, '用户名不符合规范');
    }else if(!reg.password.test(pass)){
      sock.emit('reg_ret', 1, '密码不符合规范');
    }else{//用户是否存在
      db.query(`select id from user_info where name=${user}`,(err,data)=>{
        if(err){
          sock.emit('reg_ret', 1, '数据库异常');
        }else if(data.length>0){
          sock.emit('reg_ret', 1, '用户已存在');
        }else{
          db.query(`insert into  user_info (name,password,online) values(${user},${pass},0)`,(err)=>{
            if(err){
              sock.emit('reg_ret', 1, '数据库异常');
            }else{
              sock.emit('reg_ret', 1, '注册成功');
            }
          });
        }
      });
    }
  });
  //登录
  sock.on('login',(user,pass)=>{
    if(!regs.username.test(user)){
      sock.emit('login_ret', 1, '用户名不符合规范');
    }else if(!reg.password.test(pass)){
      sock.emit('login_ret', 1, '密码不符合规范');
    }else{//用户是否存在
      db.query(`select id from user_info where name=${user}`,(err,data)=>{
        if(err){
          sock.emit('login_ret', 1, '数据库异常');
        }else if(data.length==0){
          sock.emit('login_ret', 1, '该用户不存在');
        }else if(data[0].password!=pass){
          sock.emit('login_ret', 1, '用户名或密码错误');
        }else{
          db.query(`update user_info set online=1 where id = data[0].id`(err)=>{
            if(err){
              sock.emit('login_ret', 1, '数据库异常');
            }else{
              sock.emit('login_ret', 0, '登录成功');
              cur_username=user;
              cur_userID=data[0].id;
            }
          });
        }
      });
    }
  });
  //发言
  sock.on('msg',txt=>{
    if(!txt){
      sock.emit('msg_ret',1,'消息文本不能为空');
    }else{//广播给每个人
      oSock.forEach(item=>{
        if(item==sock) return;
        item.emit('msg', cur_username, txt);
      });
      sock.emit('msg_ret', 0, '发送成功');
  });
  //离线
  sock.on('disconnect',function(){
    db.query(`update user_table set online=0 where id=${cur_userID}`,err=>{
      if(err){
        console.log('数据库异常',err);
      }
      cur_username='';
      cur_userID=0;
      oSock = oSock.filter(item=>{item!=sock});
    });
  });
});
