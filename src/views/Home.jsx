import { Wrapper } from '../components/Wrapper';
import React from 'react'
import { Dialog } from '../components/Dialog';
import { getCurrentUser } from '../utils/login';
import { redirect, useNavigate } from 'react-router-dom';

 /*<div className="p-32">
                <h1 className="text-4xl mb-5">Redirecting</h1>    
                <p className="text-lg">Please wait...</p>
            </div>*/    

const Home = () => {
  
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if(!getCurrentUser()){
      console.log("redirecting...")
      navigate("/login?ref=redirect");
    }else{
      navigate("/launcher?ref=redirect");
    }
  });
    
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

export default Home;