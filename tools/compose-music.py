"""An original 48-second ambient instrumental loop, composed for Frame Notes."""
import numpy as np
from scipy.io.wavfile import write
from pathlib import Path
sr=44100; duration=48; n=sr*duration; mix=np.zeros((n,2),dtype=np.float64)
def note(midi,start,length,amp,pan=0):
 f=440*2**((midi-69)/12); t=np.arange(int(sr*length))/sr
 env=(1-np.exp(-t/0.018))*np.exp(-t/1.55)*np.minimum(1,(length-t)/.4)
 wave=(np.sin(2*np.pi*f*t)+.23*np.sin(2*np.pi*f*2.004*t)*np.exp(-t*1.3)+.09*np.sin(2*np.pi*f*3*t)*np.exp(-t*2))*env*amp
 # Circular reverberation makes the end join smoothly to the beginning.
 for delay,gain in [(0,1),(.173,.16),(.347,.10),(.61,.05)]:
  ix=(int((start+delay)*sr)+np.arange(len(t)))%n
  mix[ix,0]+=wave*gain*np.sqrt((1-pan)/2);mix[ix,1]+=wave*gain*np.sqrt((1+pan)/2)
chords=[[48,55,60,64,67],[45,52,57,60,64],[41,48,53,57,60],[43,50,55,59,62]]
for b in range(8):
 c=chords[b%4];start=b*6
 note(c[0]-12,start,5.8,.085,0)
 for j in range(8):note(c[[1,2,3,4,2,3,1,3][j]]+12,start+j*.75,3,.10 if j%2==0 else .075,(-.28 if j%2==0 else .28))
 # A small, original top line leaves plenty of room for silence.
 melody=[[76,79,74],[72,76,79],[69,72,76],[71,74,67]][b%4]
 for j,m in enumerate(melody):note(m,start+1.5+j*1.5,3.7,.065,0.12)
mix=np.tanh(mix*1.2);mix*=.65/max(np.max(np.abs(mix)),1e-8)
p=Path('/workspace/scratch/b41d0175a79d/frame-notes-music.wav');write(p,sr,(mix*32767).astype(np.int16))
print('Original ambient loop composed: 48 seconds, stereo, 44.1 kHz')
