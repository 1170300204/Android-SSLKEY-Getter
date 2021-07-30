# Android-SSLKEY-Getter
使用hook的方法，包存Android应用的sslkey数据，并使用wireshark进行解密。
## 简介
  在进行PC段的网络流量捕获的时候，我们有时候会通过设置SSLKEYLOGFILE环境变量，来存储chrome等浏览器的SSL协商的密钥。然后通过设置wireshark的TLS解密key文件，以解密pcap文件中TLS加密的部分。但是，在Android系统下是默认未设置的，因此需要使用到hook技术，来进行密钥的获取与包存。<br>
  使用到的技术为：frida（一款轻量级的hook框架）
## 1. Frida环境的配置
  (1) 安装python并配置环境变量，这个网上有很多现有教程，十分简单，在这里就不多加赘述。<br><br>
  (2) 安装frida模块
  ```
  # pip install frida
  ```
  安装frida-tools模块
  ```
  # pip install frida-tools
  ```
  下载运行在目标设备上的frida-server段，下载时要根据自己的设备型号选择对应的版本下载（可以通过adb shell 运行cat /proc/cpuinfo查看）。下载地址 https://github.com/frida/frida/releases <br><br>
  (3) 将下载好的文件解压缩并通过and push到手机中的/data/local/tmp目录下，并赋予其777权限。以后在使用frida时，需要先启动该进程
  ```
  # ./frida-server-15.0.10-android-arm64 &
  ```
  (4) 完成以上配置之后，可以在PC端开一个命令行，并且输入以下命令：
  ```
  # frida-ps -U
  ```
  如果发现成功输出了手机上的进程PID和Name，则证明frida安装成功。
## 2. 启动tcpdump开始抓包
  Android环境下的流量捕获很多情况下都会使用tcpdump来完成。具体的方法可以参考 https://blog.csdn.net/u012426959/article/details/70227370/
  ```
  tcpdump -i any -p -s 0 -w /sdcard/dd/123.pcap //启动tcpdump进程并开始捕包
  ```
## 3. 使用frida Hook应用并输出sslkey文件
  ```
  frida -U -f com.sdu.didi.psnger -l .\sslkeyfilelog.js --no-pause -o sslkey.log
  ```
  上述代码中，com.sdu.didi.psnger是应用的包名，在具体情况下可根据待捕应用的包名进行替换。执行该命令之后，会自动打开包名所指定的应用，并会将使用期间所涉及到的sslkey信息都保存在sslkey.log文件中。
## 4. SSL数据解密
  在停止抓包后，将生成的pcap文件拉取到PC端。使用wireshark打开pcap，然后在`编辑-->首选项-->Protocols-->TLS`中，设置`(Pre)-Master-Secret log filename`为frida生成的log文件，即可以看到解密后的结果。<br><br>

参考链接：https://codeshare.frida.re/@k0nserv/tls-keylogger/
