!include LogicLib.nsh

!ifdef BUILD_UNINSTALLER
  !define REPODITOR_FILE_ATTRIBUTE_DIRECTORY 0x10
  !define REPODITOR_FILE_ATTRIBUTE_REPARSE_POINT 0x400

  ; Remove one exact RepoDitor-owned tree without following junctions or symlinks.
  Function un.RemoveRepoDitorData
    Exch $R0
    Push $R1
    Push $R2
    Push $R3
    Push $R4
    Push $R5

    System::Call 'kernel32::GetFileAttributes(t R0)i .R1'
    StrCmp $R1 -1 done

    IntOp $R2 $R1 & ${REPODITOR_FILE_ATTRIBUTE_REPARSE_POINT}
    IntOp $R3 $R1 & ${REPODITOR_FILE_ATTRIBUTE_DIRECTORY}
    ${If} $R2 != 0
      ${If} $R3 != 0
        RMDir "$R0"
      ${Else}
        Delete "$R0"
      ${EndIf}
      Goto done
    ${EndIf}

    FindFirst $R1 $R2 "$R0\*.*"
    loop:
      StrCmp $R2 "" removeRoot
      StrCmp $R2 "." next
      StrCmp $R2 ".." next

      StrCpy $R3 "$R0\$R2"
      System::Call 'kernel32::GetFileAttributes(t R3)i .R4'
      StrCmp $R4 -1 next
      IntOp $R5 $R4 & ${REPODITOR_FILE_ATTRIBUTE_DIRECTORY}
      ${If} $R5 != 0
        Push "$R3"
        Call un.RemoveRepoDitorData
      ${Else}
        Delete "$R3"
      ${EndIf}

    next:
      FindNext $R1 $R2
      Goto loop

    removeRoot:
      FindClose $R1
      RMDir "$R0"

    done:
      Pop $R5
      Pop $R4
      Pop $R3
      Pop $R2
      Pop $R1
      Pop $R0
  FunctionEnd

  !macro customUnInstall
    ${IfNot} ${isUpdated}
      ${If} $installMode == "all"
        SetShellVarContext current
      ${EndIf}

      Push "$APPDATA\repoditor-desktop"
      Call un.RemoveRepoDitorData
      Push "$LOCALAPPDATA\RepoDitor"
      Call un.RemoveRepoDitorData

      ${If} $installMode == "all"
        SetShellVarContext all
      ${EndIf}
    ${EndIf}
  !macroend
!endif
