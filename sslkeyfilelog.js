// https://codeshare.frida.re/@k0nserv/tls-keylogger/
// 该方法相当于PC上运行chrome设置SSLKEYLOGFILE环境变量记录SSL协商的密钥，在android上，默认未设置，因此需要我们通过Hook进行设置

// 该方法适用于使用了动态链接libssl.so的程序，即使用OpenSSL开发的程序
// 直接对"SSL_CTX_new"进行hook，以找到指向每个SSL_CTX的指针，然后直接调用SSL_CTX_set_keylog_callback
// 该方法要求能够找到指向"SSL_CTX_new"和"SSL_CTX_set_keylog_callback"指针，虽然并不总是能够找到

//开始记录TLS密钥，应在回复二进制文件之前调用或通过脚本调用
//@param SSL_CTX_new : 'SSL_CTX_new'的解析地址，通过Module.findExportByName获得
//@param SSL_CTX_set_keylog_callback : 'SSL_CTX_set_keylog_callback'的解析地址，通过Module.findExportByName获得
function startTLSKeyLogger(SSL_CTX_new, SSL_CTX_set_keylog_callback) {
    function keyLogger(ssl, line) {
        console.log(new NativePointer(line).readCString());
    }
    const keyLogCallback = new NativeCallback(keyLogger, 'void', ['pointer', 'pointer']);

    Interceptor.attach(SSL_CTX_new, {
        onLeave: function(retval) {
            const ssl = new NativePointer(retval);
            const SSL_CTX_set_keylog_callbackFn = new NativeFunction(SSL_CTX_set_keylog_callback, 'void', ['pointer', 'pointer']);
            SSL_CTX_set_keylog_callbackFn(ssl, keyLogCallback);
        }
    });
}
startTLSKeyLogger(
    Module.findExportByName('libssl.so', 'SSL_CTX_new'),
    Module.findExportByName('libssl.so', 'SSL_CTX_set_keylog_callback')
)


// findExportByName(exportName), getExportByName(exportName): 
// returns the absolute address of the export named exportName. 
// In the event that no such export could be found, the find-prefixed function returns null whilst the get-prefixed function throws an exception.
// 返回指定模块的导出模块的绝对地址.
// 如果您不确定指定模块的名称, 您可以传入 null, 但这可能会消耗大量资源, 应当尽量避免.
// 当找不到相应的模块时, find 前缀的方法返回 null 而 get 前缀的方法抛出异常.

// new NativeFunction(address, returnType, argTypes[, abi]): 
// create a new NativeFunction to call the function at address (specified with a NativePointer), 
// where returnType specifies the return type, and the argTypes array specifies the argument types. 
// You may optionally also specify abi if not system default. 
// For variadic functions, add a '...' entry to argTypes between the fixed arguments and the variadic ones.
// 创建一个用于调用 NativePointer 类型的 address 处的方法的 NativeFunction 对象, 
// returnType 指明了返回值的类型, argTypes 数组指明了参数类型. 
// 如果不是系统的默认值, 您也可以提供可选的 abi 参数. 对于参数可变的方法, 请在固定参数与可变参数之间加上 '...' 条目.

// new NativeCallback(func, returnType, argTypes[, abi]): 
// create a new NativeCallback implemented by the JavaScript function func, 
// where returnType specifies the return type, and the argTypes array specifies the argument types. 
// You may also specify the abi if not system default. 
// See NativeFunction for details about supported types and abis. 
// Note that the returned object is also a NativePointer, and can thus be passed to Interceptor#replace. 
// When using the resulting callback with Interceptor.replace(), func will be invoked with this bound to an object with some useful properties, just like the one in Interceptor.attach().
// 创建一个新的 NativeCallback 并将 JavaScript 方法 func 作为其实现方式, returnType 指明了返回值的类型, argTypes 数组指明了参数类型.
// 如果不是系统的默认值, 您也可以提供可选的 abi 参数.
// 关于受支持的类型和 abi 请参考 NativeFunction.
// 注意, 返回的对象也是一个 NativePointer, 因此可以将其传递给 Interceptor#replace.
// 当与 Interceptor#replace() 一起使用时, func 将伴随有多个实用属性的 this 参数一起被调用, 类似于 Interceptor#attach().

// Interceptor.attach(target, callbacks[, data]): 
// intercept calls to function at target. 
// This is a NativePointer specifying the address of the function you would like to intercept calls to. 
// Note that on 32-bit ARM this address must have its least significant bit set to 0 for ARM functions, and 1 for Thumb functions. 
// Frida takes care of this detail for you if you get the address from a Frida API (for example Module.getExportByName()).
// 拦截位于 target 的方法的调用. target 是一个 NativePointer 类型的对象, 指明了您想要拦截的方法的地址.
// 请注意, 在 32 位 ARM 上, 对于 ARM 函数, 此地址的最低有效位必须设置为 0, 对于 Thumb 函数, 此地址必须设置为 1.
// 如果您通过 Frida 的 API 来获得一个地址, 例如 Module.getExportByName(), 那么 Frida 就会替您处理这个细节.

// onLeave: fucnction(retval)：
// 在原方法返回前出发
// retval是一个含有原返回值的NativePointer驱动的对象
// 可以调用retval.replace(1337)将返回值替换为整形1337，或调用retval.replace("0x1234")将返回值替换为一个指针
// 该对象在onLeave调用完之后会被回收，因此不要保存并在回调以外的地方使用该对象
// 如果需要保存其包含的值，可以执行一次深度复制，例如：ptr(retval.toString())
