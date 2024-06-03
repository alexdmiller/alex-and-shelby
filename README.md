### ffmpeg commands
#### compressing video to 1/4 size
`ffmpeg -i input.mkv -vf "scale=trunc(iw/8)*2:trunc(ih/8)*2" a_fourth_the_frame_size.mkv`

#### slowing video by 50%
`ffmpeg -i input.mp4 -filter:v "setpts=2.0*PTS" output.mp4`