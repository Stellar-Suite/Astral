import { unfuck } from "../@/lib/utils";
import { streamerClientManager } from "../client/streamer_client";
import React from "react";

import { Gamepad2 } from 'lucide-react';

import { toast } from "sonner"

// https://ui.shadcn.com/docs/components/table
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../@/components/ui/table"

import { Button } from "../@/components/ui/button";

export function GamepadPanel(props) {

  const sid = props.sid;

  let client = streamerClientManager.allocate(sid, {}, false);

  const [gamepads, setGamepads] = React.useState([]);

  function onGamepadMutation(){
    let gamepadHelper = client.gamepads;
    let gamepadData = [];
    for(let gamepad of gamepadHelper.gamepads){
      let metadata = gamepadHelper.gamepadMetadata[gamepad.index];
      console.log("gamepad",gamepad, metadata);
      gamepadData.push({
        ...metadata,
        index: gamepad.index,
      });
    }
    setGamepads(gamepadData);
  }

  React.useEffect(() => {

    client.gamepads.addEventListener("gamepadMutation", onGamepadMutation);

    return () => {
      client.gamepads.removeEventListener("gamepadMutation", onGamepadMutation);
    }
  });

  async function onAttach(gamepadDescriptor){
    try{
      const attachPromise = client.gamepads.attachToRemote(gamepadDescriptor);
      onGamepadMutation(); // block the button now
      toast(`Attaching gamepad {gamepadDescriptor.index}...`);
      await attachPromise;
      toast(`Gamepad {gamepadDescriptor.index} attached.`);
    }catch(ex){
      toast(`Failed to attach gamepad {gamepadDescriptor.index}: ${ex}`);
    }
    onGamepadMutation();
  }

  
  return (
    <Table>
      <TableCaption>Gamepad configuration.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Gamepad</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Attached</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">1</TableCell>
          <TableCell>IDK</TableCell>
          <TableCell>Xbox 360</TableCell>
          <TableCell className="text-right">TODO</TableCell>
        </TableRow>
        {
          gamepads.map((gamepad) => {
            return (
              <TableRow key={gamepad.index}>
                <TableCell className="font-medium"><Gamepad2 className="inline-block" /> {gamepad.index}</TableCell>
                <TableCell className="text-ellipsis text-bold whitespace-nowrap overflow-hidden max-w-20">{gamepad.id}</TableCell>
                <TableCell>{gamepad.product_type}</TableCell>
                <TableCell className="text-right">
                  {
                    gamepad.syncing ? <Button variant="destructive" className="w-full">Detach</Button> : <Button variant="primary" className="w-full" disabled={gamepad.connecting} onClick={() => onAttach(gamepad)}>{gamepad.connecting ? "Attaching...": "Attach"}</Button>
                  }
                </TableCell>
              </TableRow>
            )
          })
        }
      </TableBody>
    </Table>
  );
}