Thanks to Marcia Villalba.
https://github.com/mavi888/websockets-chat/

Note: Open the index.html file manually in the browser.

Here she showed message broadcasting to all connected client.

I did some R&D , then improve this code by sending one to one message.

[singleMessageHandler] and its corresponding code has been added.

https://www.youtube.com/watch?v=R1uLyTclLq8&ab_channel=FooBarServerless


How to deploy:
===================
1. first setup aws-cli (global)
2. command => aws configure  (accesskey / token) from IAM
3. install serverless-cli (global)
4. serverless deploy --stage dev  [For dev environment]
5. serverless deploy --stage prob  [For Production environment] 
6. Check inside cli is it working or not?
   Install wscat (globally)
7. Open terminal,
   command => wscat -c "copy and paste serverless-url"
8. check dynamodb table for coonection
9. For env variable => Go to "connectionHandler" function => configuration => set env value.

Done!!

