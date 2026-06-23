@echo off
setlocal
set "BASEDIR=%~dp0"
"%BASEDIR%.mvn\apache-maven-3.9.9\bin\mvn.cmd" %*
