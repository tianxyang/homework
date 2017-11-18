//引入需要的模块
console.log('node启动了');
const http = require('http');
const io = require('socket.io');
const mysql = require('mysql');
const fs = require('fs');
const url = require('url');
const regs = require('./libs/regs');
//链接到数据库
let db = mysql.createPool({host:'localhost',user:'root',password:'123456',database:'user'});
//创建HTTP服务
let server = http.createServer((req,res)=>{
  let {pathname,query} = url.parse(req.url,true);
  if(pathname=='/reg'){
    let {user,pass} = query;
    //注册接口
    //校验数据
    if(!regs.username.test(user)){
      res.write(JSON.stringify({code:1,msg:"用户名不符合规范"}));
      res.end();
    }else if(!regs.password.test(pass)){
      res.write(JSON.stringify({code:1,msg:"密码不符合规范"}));
    }else{
      //再输入内容符合规范的时候再取数据校验，检查是否已存在
      db.query(`select id from user_info where name=${user}`,(err,data)=>{
        if(err){
          res.write(JSON.stringify({code:1,msg:"数据库链接异常"}));
          res.end();
        }else if(data.length>0){
          res.write(JSON.stringify({code:1,msg:"用户名已存在"}));
          res.end();
        }else{//校验通过则需要将数据写入数据库
          db.query(`insert into user_info(name,password,online) values('${user}','${pass},0)`,err=>{
            if(err){
              res.write(JSON.stringify({code:1,msg:"数据库异常"}));
              res.end();
            }else{
              res.write(JSON.stringify({code:0,msg:"注册成功！"}));
              res.end();
            }
          });
        }
      });
    }

  }else if(pathname=='/login'){
    //登录接口
    let {user,pass} = query;
    if(!regs.username.test(user)){
      res.write(JSON.stringify({code:1,msg:"用户名不符合规范"}));
      res.end();
    }else if(!regs.password.test(pass)){
      res.write(JSON.stringify({code:1,msg:"密码不符合规范"}));
      res.end();
    }else{//跟数据库比对信息正确性
      db.query(`select id from user_info where name=${user}`,(err,data)=>{
        if(data.length==0){
          res.write(JSON.stringify({code:1,msg:"该用户不存在"}));
          res.end();
        }else if(data[0].password!=pass){
          res.write(JSON.stringify({code:1,msg:"用户名或密码错误！"}));
          res.end();
        }else{//登录成功需要修改在线状态
          db.query(`update user_info set online=1 where id='${data[0].id}'`,err=>{
            if(err){
              res.write(JSON.stringify({code:1,msg:"数据库异常"}));
              res.end();
            }else{
              res.write(JSON.stringify({code:0,msg:"登录成功！"}));
              res.end();
            }
          });
        }
      });
    }
  }else{
    //跳转到给定页面
    fs.readFile(`www${pathname}`,(err,data)=>{
      if(err){
        res.writeHeader(404);
        res.write('Not Found');
      }else{
        res.write(data);
      }
      res.end();
    });
  }
});
server.listen(8080);
