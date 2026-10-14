export function fakeRunnerGl() {
 const calls=[];let serial=0;
 const gl={calls,createShader:()=>({id:++serial}),createProgram:()=>({id:++serial}),createBuffer:()=>({id:++serial}),createTexture:()=>({id:++serial}),createFramebuffer:()=>({id:++serial}),getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:(_p,name)=>({a_position:0,a_uv:1,a_color:2}[name]),getUniformLocation:(_p,name)=>name,checkFramebufferStatus:()=>gl.FRAMEBUFFER_COMPLETE};
 const names=['VERTEX_SHADER','FRAGMENT_SHADER','COMPILE_STATUS','LINK_STATUS','TEXTURE0','TEXTURE_2D','RGBA','UNSIGNED_BYTE','TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER','NEAREST','TEXTURE_WRAP_S','TEXTURE_WRAP_T','CLAMP_TO_EDGE','ARRAY_BUFFER','FLOAT','DEPTH_TEST','CULL_FACE','BLEND','ONE','ONE_MINUS_SRC_ALPHA','UNPACK_PREMULTIPLY_ALPHA_WEBGL','UNPACK_FLIP_Y_WEBGL','FRAMEBUFFER','COLOR_ATTACHMENT0','FRAMEBUFFER_COMPLETE','COLOR_BUFFER_BIT','TRIANGLES','STREAM_DRAW','SCISSOR_TEST'];names.forEach((name,i)=>gl[name]=i+1);
 for(const name of ['shaderSource','compileShader','deleteShader','attachShader','linkProgram','deleteProgram','useProgram','uniform1i','activeTexture','bindTexture','texParameteri','bindBuffer','enableVertexAttribArray','vertexAttribPointer','disable','enable','blendFunc','pixelStorei','bindFramebuffer','framebufferTexture2D','viewport','uniform2f','clearColor','clear','drawArrays','deleteTexture','deleteFramebuffer','deleteBuffer'])gl[name]=(...args)=>calls.push({name,args});
 gl.bufferData=(_target,data)=>calls.push({name:'bufferData',bytes:typeof data==='number'?data:data.byteLength});
 gl.bufferSubData=(_target,offset,data)=>calls.push({name:'bufferSubData',offset,bytes:data.byteLength});
 gl.texImage2D=(...args)=>calls.push({name:'texImage2D',width:args.length===6?args[5].width:args[3],height:args.length===6?args[5].height:args[4],source:args.length===6?args[5]:null});
 gl.scissor=(...args)=>calls.push({name:'scissor',args});
 gl.checkFramebufferStatus=()=>{calls.push({name:'checkFramebufferStatus'});return gl.FRAMEBUFFER_COMPLETE;};
 return gl;
}
