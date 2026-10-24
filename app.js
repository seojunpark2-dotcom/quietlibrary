let minutes=25,seconds=1500,total=1500,paused=false,muted=false,timer;
const $=id=>document.getElementById(id);

function clickSound(){
  const context=new AudioContext(),oscillator=context.createOscillator(),gain=context.createGain();
  oscillator.frequency.setValueAtTime(540,context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(380,context.currentTime+.055);
  gain.gain.setValueAtTime(.07,context.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.065);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime+.07);
}

function navigateWithSound(event){
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  clickSound();
  const destination=event.currentTarget.href;
  window.setTimeout(()=>window.location.assign(destination),110);
}

function show(id){
  document.querySelectorAll('.screen').forEach(screen=>screen.classList.remove('active'));
  $(id).classList.add('active');
  if(id!=='focus')stopSound();
  $('celebration').classList.remove('show');
}

function theme(name){
  $('app').classList.toggle('light',name==='light');
  $('dark').classList.toggle('active',name==='dark');
  $('light').classList.toggle('active',name==='light');
}

function setMinutes(value){
  minutes=Math.max(1,Math.min(180,Number(value)||1));
  $('minutes').value=minutes;
  seconds=minutes*60;
  total=seconds;
  $('clock').textContent=format(seconds);
  $('books').style.transform=`scale(${Math.max(1,Math.min(1.75,1+((minutes-1)/179)*.75))})`;
  document.querySelectorAll('.presets button').forEach(button=>button.classList.toggle('active',button.textContent===minutes+'분'));
}

function adjust(delta){
  setMinutes(delta===1?(minutes<5?5:minutes+5):(minutes<=5?1:minutes-5));
}

function format(value){
  return String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');
}

function start(){
  seconds=minutes*60;
  total=seconds;
  paused=false;
  show('focus');
  $('pause').textContent='Ⅱ 일시 정지';
  $('exit').style.display='none';
  render();
  playSound();
  clearInterval(timer);
  timer=setInterval(()=>{
    if(!paused&&seconds>0){
      seconds--;
      render();
      if(!seconds)complete();
    }
  },1000);
}

function render(){
  $('clock').textContent=format(seconds);
  $('progress').style.strokeDashoffset=1-seconds/total;
}

function pause(){
  paused=!paused;
  $('state').textContent=paused?'잠시 쉬는 중':'FOCUS TIME';
  $('pause').textContent=paused?'▶ 다시 시작':'Ⅱ 일시 정지';
  $('exit').style.display=paused?'block':'none';
  if(paused)$('ambience').pause(); else playSound();
}

function complete(){
  clearInterval(timer);
  stopSound();
  $('message').innerHTML=minutes+'분의 집중이 차곡차곡<br>당신의 내일을 만들어가고 있어요.';
  $('celebration').classList.add('show');
}

function playSound(){
  const player=$('ambience');
  player.volume=Number($('volumeRange').value)/100;
  player.muted=muted;
  if(paused||seconds<=0||!$('focus').classList.contains('active'))return;
  player.play().catch(()=>{
    // The timer continues if playback is blocked or the audio cannot load.
    $('sound').title='소리를 재생하려면 다시 눌러 주세요.';
  });
}

function stopSound(){
  const player=$('ambience');
  player.pause();
  player.currentTime=0;
}

function toggleSound(){
  muted=!muted;
  $('sound').classList.toggle('muted',muted);
  $('sound').setAttribute('aria-pressed',String(!muted));
  playSound();
}

function volume(value){
  $('volumeLabel').textContent='음량 '+value+'%';
  $('ambience').volume=Number(value)/100;
}

function home(){
  clearInterval(timer);
  stopSound();
  show('welcome');
}

function closeInfo(){
  $('modal').classList.remove('show');
}

function bindEvents(){
  $('homeButton').addEventListener('click',home);
  document.querySelectorAll('[data-sound-nav]').forEach(link=>link.addEventListener('click',navigateWithSound));
  $('dark').addEventListener('click',()=>theme('dark'));
  $('light').addEventListener('click',()=>theme('light'));
  $('enterButton').addEventListener('click',()=>show('setup'));
  $('decreaseTime').addEventListener('click',()=>adjust(-1));
  $('increaseTime').addEventListener('click',()=>adjust(1));
  $('minutes').addEventListener('input',event=>setMinutes(event.currentTarget.value));
  $('preset30').addEventListener('click',()=>setMinutes(30));
  $('preset60').addEventListener('click',()=>setMinutes(60));
  $('preset90').addEventListener('click',()=>setMinutes(90));
  $('startButton').addEventListener('click',start);
  $('backButton').addEventListener('click',()=>show('welcome'));
  $('sound').addEventListener('click',toggleSound);
  $('volumeRange').addEventListener('input',event=>volume(event.currentTarget.value));
  $('pause').addEventListener('click',pause);
  $('exit').addEventListener('click',home);
  $('newSession').addEventListener('click',()=>show('setup'));
  $('modalClose').addEventListener('click',closeInfo);
  document.addEventListener('click',event=>{if(event.target.closest('button'))clickSound();});
}

bindEvents();
const requestedMinutes=Number(new URLSearchParams(window.location.search).get('minutes'));
if([30,60,90].includes(requestedMinutes)){
  setMinutes(requestedMinutes);
  show('setup');
}else{
  setMinutes(25);
}
