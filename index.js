var loginButton = document.querySelector('button#loginButton');
var logoutButton = document.querySelector('button#logoutButton');
var callButton = document.querySelector('button#callButton');
var hangButton = document.querySelector('button#hangButton');
var dialedButton = document.querySelector('button#dialedButton')

dialedButton.disabled = true;


loginButton.onclick = login
logoutButton.onclick = logout
callButton.onclick = call
hangButton.onclick = hangup
dialedButton.onclick = dialed

var userID = "user0";
var userSig = window.genTestUserSig(userID).userSig;
var roomID = "10086";
var callID = "user1";
let Trtc;
let startT;

// 初始化 SDK 实例
const tim = TIM.create({
  SDKAppID: window.genTestUserSig('').SDKAppID
})
window.setLogLevel = tim.setLogLevel
tim.on(TIM.EVENT.MESSAGE_RECEIVED, onReceiveMessage)
tim.on(TIM.EVENT.SDK_READY, onReadyStateUpdate)

// 无日志级别
// tim.setLogLevel(4)
function onReadyStateUpdate() {
    console.log("ready update...")

};
function onReceiveMessage({ data: messageList }) {
    console.log("recieve...");
    document.querySelector('button#dialedButton').disabled = false;
    handleVideoMessage(messageList);
    
};

function handleVideoMessage(messageList) {

        const videoMessageList = messageList.filter(
          message => message.type === this.TIM.TYPES.MSG_CUSTOM && this.isJsonStr(message.payload.data)
        )
        if (videoMessageList.length === 0) return
        const videoPayload = JSON.parse(videoMessageList[0].payload.data)
        if (videoPayload.action === ACTION.VIDEO_CALL_ACTION_DIALING) {
          if (this.isBusy) {
            this.$bus.$emit('busy', videoPayload, videoMessageList[0])
            return
          }
          this.$store.commit('GENERATE_VIDEO_ROOM', videoPayload.room_id)
          this.selectConversation(videoMessageList[0].conversationID) // 切换当前会话页
          if (videoMessageList[0].from !== this.userID) {
            this.$bus.$emit('isCalled')
          }
        }
        if (videoPayload.action === ACTION.VIDEO_CALL_ACTION_SPONSOR_CANCEL) {
          this.$bus.$emit('missCall')
        }
        if (videoPayload.action === ACTION.VIDEO_CALL_ACTION_REJECT) {
          this.$bus.$emit('isRefused')
        }
        if (videoPayload.action === ACTION.VIDEO_CALL_ACTION_SPONSOR_TIMEOUT) {
          this.$bus.$emit('missCall')
        }
        if (videoPayload.action === ACTION.VIDEO_CALL_ACTION_ACCEPTED) {
          this.$bus.$emit('isAccept')
        }
        if (videoPayload.action === ACTION.VIDEO_CALL_ACTION_HANGUP) {
          this.$bus.$emit('isHungUp')
        }
        if (videoPayload.action === ACTION.VIDEO_CALL_ACTION_LINE_BUSY) {
          this.$bus.$emit('isRefused')
        }
        if (videoPayload.action === ACTION.VIDEO_CALL_ACTION_ERROR) {
          this.$bus.$emit('isRefused')
        }

};

function login() {
    console.log("loginbutton")
    let promise = tim.login({userID: userID, userSig: userSig});
    promise.then(function(imResponse) {
    console.log(imResponse.data); // 登录成功
    if (imResponse.data.repeatLogin === true) {
        // 标识账号已登录，本次登录操作为重复登录。v2.5.1 起支持
        console.log(imResponse.data.errorInfo);
    }
    }).catch(function(imError) {
    console.warn('login error:', imError); // 登录失败的相关信息
    });

    tim.on(TIM.EVENT.MESSAGE_RECEIVED, onReceiveMessage)
    tim.on(TIM.EVENT.SDK_READY, onReadyStateUpdate)
    console.log("login success")
};

function logout() {
    let promise = tim.logout();
    promise.then(function(imResponse) {
    console.log(imResponse.data); // 登出成功
    }).catch(function(imError) {
    console.warn('logout error:', imError);
    });
};

async function initTrtc(options) { // 初始化 trtc 进入房间
    Trtc = new RtcClient(options)
    await Trtc.createLocalStream({ audio: true, video: true }).then(() => { // 在进房之前，判断设备
        Trtc.join()
    }).catch(() => {
      alert(
        '请确认已连接摄像头和麦克风并授予其访问权限！'
      )
    })
  };

function sendVideoMessage(action, duration = 0) {
    const options = {
      room_id: roomID,
      call_id: userID,
      action,
      version: VERSION,
      invited_list: [],
      duration
    }
    const message = tim.createCustomMessage({
      to: callID,
      conversationType: TIM.TYPES.CONV_C2C,
      payload: {
        data: JSON.stringify(options),
        description: '',
        extension: ''
      }
    })
    tim.sendMessage(message)
};

function dialed() {
    const options = {
     userId: userID,
      userSig: userSig,
      roomId: roomID,
      sdkAppId: window.genTestUserSig('').SDKAppID
    }
    initTrtc(options).then(() => {
      sendVideoMessage(ACTION.VIDEO_CALL_ACTION_ACCEPTED)
      startT = new Date()
    })
};

function call() {
    const options = {
        userId: userID,
        userSig: userSig,
        roomId: roomID,
        sdkAppId: window.genTestUserSig('').SDKAppID
      }
    startT = new Date();
    initTrtc(options).then(() => {
        // if (!this.ready) return
        // changeState('dialling', true)
        // timer = setTimeout(this.timeout, process.env.NODE_ENV === 'development' ? 999999 : 60000) // 开始计时器，开发环境超时时间较长，便于调试
        sendVideoMessage(ACTION.VIDEO_CALL_ACTION_DIALING)
      })
};

function hangup() {
    // this.changeState('calling', false)
      Trtc.leave();
      end = new Date();
      const duration = parseInt((end - start) / 1000);
      this.sendVideoMessage(ACTION.VIDEO_CALL_ACTION_HANGUP, duration)

};

function accept() { // 接听电话
    // this.changeState('calling', true)
    const options = {
     userId: userID,
      userSig: userSig,
      roomId: roomID,
      sdkAppId: window.genTestUserSig('').SDKAppID
    }
    initTrtc(options).then(() => {
      sendVideoMessage(ACTION.VIDEO_CALL_ACTION_ACCEPTED)
      startT = new Date()
    })
  };

