package dev.nightwire;
import android.os.Looper;
import java.io.*;
import java.lang.reflect.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import org.json.*;

/** Actual ART checks of native import and atomic catalog persistence. */
public class NativeChecks {
 static File root;
 static class Subject extends MainActivity { @Override public File getFilesDir(){return root;} }
 static void check(boolean value,String message){if(!value)throw new AssertionError(message);}
 static Object get(Object o,String name)throws Exception{Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return f.get(o);}
 static void set(Object o,String name,Object value)throws Exception{Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);f.set(o,value);}
 static String add(Subject s,String name,byte[] bytes)throws Exception{Method m=MainActivity.class.getDeclaredMethod("importText",String.class,byte[].class);m.setAccessible(true);try{return (String)m.invoke(s,name,bytes);}catch(InvocationTargetException e){throw (Exception)e.getCause();}}
 static void rejects(Subject s,String name,byte[] bytes,String message)throws Exception{try{add(s,name,bytes);throw new AssertionError(message);}catch(IOException expected){}}
 public static void main(String[] args)throws Exception{
  Looper.prepareMainLooper();root=new File(args[0]);root.mkdirs();File docs=new File(root,"documents");docs.mkdirs();Subject s=new Subject();set(s,"docsDir",docs);
  try{
   String source="# Unicode 日本\n\nKeep **source** unchanged.\n";String id=add(s,"Downloaded.md",source.getBytes(StandardCharsets.UTF_8));
   check(id.matches("[a-f0-9]{64}"),"content-addressed ID");File copy=new File(docs,id+".md");check(copy.exists(),"private copy exists");
   check(new String(java.nio.file.Files.readAllBytes(copy.toPath()),StandardCharsets.UTF_8).equals(source),"source preserved byte for byte");
   check(add(s,"Downloaded.md",source.getBytes(StandardCharsets.UTF_8)).equals(id),"exact duplicate reuses the same copy");check(((JSONArray)get(s,"catalog")).length()==1,"no duplicate catalog row");
   String changed=add(s,"Downloaded.md",(source+"Updated\n").getBytes(StandardCharsets.UTF_8));check(!id.equals(changed),"changed source creates a separate reading copy");
   byte[] bom=("\ufeff# BOM\n").getBytes(StandardCharsets.UTF_8);String bomId=add(s,"bom.md",bom);check(!new String(java.nio.file.Files.readAllBytes(new File(docs,bomId+".md").toPath()),StandardCharsets.UTF_8).startsWith("\ufeff"),"UTF-8 BOM handled");
   String u16=add(s,"utf16.md","# UTF16 日本\n".getBytes(StandardCharsets.UTF_16));check(new String(java.nio.file.Files.readAllBytes(new File(docs,u16+".md").toPath()),StandardCharsets.UTF_8).equals("# UTF16 日本\n"),"UTF-16 decoded and normalized");
   rejects(s,"binary.md",new byte[]{0,1,2},"binary rejection");rejects(s,"invalid.md",new byte[]{(byte)0xff,(byte)0xff},"malformed UTF-8 rejection");
   byte[] oversize=new byte[8*1024*1024+1];java.util.Arrays.fill(oversize,(byte)97);rejects(s,"oversize.md",oversize,"oversize rejection");
   JSONArray disk=new JSONArray(new String(java.nio.file.Files.readAllBytes(new File(root,"catalog.json").toPath()),StandardCharsets.UTF_8));check(disk.length()==4,"atomic persistent catalog has all successful imports");
   Method read=MainActivity.class.getDeclaredMethod("readLimited",InputStream.class,int.class);read.setAccessible(true);try{read.invoke(s,new ByteArrayInputStream(new byte[12]),10);throw new AssertionError("stream read must enforce limit");}catch(InvocationTargetException e){check(e.getCause() instanceof IOException,"stream limit failure is handled");}
   System.out.println("PASS: Android ART imports, byte preservation, duplicate reopening, changed files, BOM, UTF-16, binary/UTF-8/size rejection and atomic catalog persistence");
  }finally{((ExecutorService)get(s,"io")).shutdownNow();}
 }
}
