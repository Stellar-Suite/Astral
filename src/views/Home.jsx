import { Wrapper } from '../components/Wrapper';
import React from 'react'
import { Dialog } from '../components/Dialog';

 /*<div className="p-32">
                <h1 className="text-4xl mb-5">Redirecting</h1>    
                <p className="text-lg">Please wait...</p>
            </div>*/    

const Home = () => {
  
    
  return (
    <React.Fragment>
      <Wrapper>
        <Dialog>
            <div className="center-xy">
                <h1 className="text-4xl">Redirecting...</h1>
                <p className="text-lg">Please check your browser if you are not redirected within a few seconds. </p>
            </div>
        </Dialog>
        </Wrapper>
    </React.Fragment>
  );
};

export default Home