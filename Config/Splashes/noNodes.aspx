<%@ Page Language="C#" AutoEventWireup="true"%>
<%@ Import Namespace="Umbraco.Core.Configuration" %>
<%@ Import Namespace="Umbraco.Core.IO" %>

<!doctype html>
<!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en"> <![endif]-->
<!--[if IE 7]>    <html class="no-js ie7 oldie" lang="en"> <![endif]-->
<!--[if IE 8]>    <html class="no-js ie8 oldie" lang="en"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js" lang="en"> <!--<![endif]-->
<head>
 <meta charset="utf-8">
 <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
 <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    
 <title></title>
 <meta name="description" content="">
 <meta name="author" content="">

 <link href='//fonts.googleapis.com/css?family=Open+Sans:300,400,700,600' rel='stylesheet' type='text/css'>
 <link href='//fonts.googleapis.com/css?family=Asap:400,700,400italic,700italic' rel='stylesheet' type='text/css'>

 <link rel="stylesheet" href="../../Umbraco/assets/css/nonodes.style.min.css" />
 <link rel="stylesheet" href="../../app_plugins/deploy/deployStyles.css" />

 <!--[if lt IE 9]>
  <script src="//cdnjs.cloudflare.com/ajax/libs/modernizr/2.7.1/modernizr.min.js"></script>
 <![endif]-->

</head>
<body>

<% if(HttpContext.Current.Request.IsLocal == false){  %>  
<section>
    <article>
        <div>
            <div class="logo"></div>

            <h1>Welcome to your Umbraco installation</h1>
            <h3>You're seeing the wonderful page because your website doesn't contain any published content yet.</h3>

            <div class="cta">
                <a href="<%= IOHelper.ResolveUrl(SystemDirectories.Umbraco) %>" class="button">Open Umbraco</a>
            </div>


            <div class="row">
                <div class="col">
                    <h2>Easy start with Umbraco.tv</h2>
                    <p>We have created a bunch of 'how-to' videos, to get you easily started with Umbraco. Learn how to build projects in just a couple of minutes. Easiest CMS in the world.</p>
                    
                    <a href="http://umbraco.tv?ref=tvFromInstaller" target="_blank">Umbraco.tv &rarr;</a>
                </div>

                <div class="col">
                    <h2>Be a part of the community</h2>
                    <p>The Umbraco community is the best of its kind, be sure to visit, and if you have any questions, we’re sure that you can get your answers from the community.</p>
                    
                    <a href="http://our.umbraco.org?ref=ourFromInstaller" target="_blank">our.Umbraco &rarr;</a>
                </div>
            </div>

        </div>
    </article>
</section>

<% }else{ %> 
    
<section ng-controller="Umbraco.NoNodes.Controller">
    <article class="restore">

        <div>
            <div class="logo"></div>

            
            <ul class="unstyled" ng-switch="step">
                
                <li ng-switch-default>
                    
                    <form novalidate>
                        <h1>Restore from Umbraco as a Service</h1>

                        <p>Login to pull down the latest content from Umbraco as a Service</p>

                        <div class="login">
                        
                            <div class="input">
                                <label>Login</label>
                                <input type="text" ng-model="login" required />
                            </div>

                            <div class="input">
                                <label>Password</label>
                                <input type="password" ng-model="password" required />
                            </div>

                            <div class="error" ng-if="authError">Could not authenticate user '{{authErrorLogin}}'</div>
                        </div>


                        <div class="cta" ng-class="{'cta-disabled': submitting}">
                            <input type="submit" ng-disabled="submitting" class="button" ng-click="remoteContent(login, password)" value="Restore" />
                            <small><span>or</span> <a href ng-click="skipRestore()">Skip downloading</a></small>
                        </div>

                    </form>

                 </li>

                <li ng-switch-when="remoteContent">
                    <h1>Downloading content from <br/>Umbraco as a Service...</h1>
                    
                    <p>{{currentTask.done}} of {{currentTask.total}} downloaded</p>
                    
                        
                    <div style="overflow: hidden; padding: 20px 0 20px 0">
                        <div class="umb-loader"></div> 
                    </div>
                    <small>{{currentTask.currentActivity}}</small>
                </li>


                <li ng-switch-when="restoreWebsite">
                    <h1>Restoring your website...</h1>
                    
                    <p>{{currentTask.done}} of {{currentTask.total}} restored</p>
                    
                        
                    <div style="overflow: hidden; padding: 20px 0 20px 0">
                        <div class="umb-loader"></div> 
                    </div>

                </li>

                 <li ng-switch-when="done">
                    <h1>Ready to rock n' roll!</h1>
                    
                    <p>Everything has been restored and is ready for use, click below to open the backoffice</p>
                    
                        
                    <div class="cta" ng-if="ready">
                        <a href="<%= IOHelper.ResolveUrl(SystemDirectories.Umbraco) %>" class="button">Open Umbraco</a>
                    </div>
                </li>
                
                <li ng-switch-when="doneSkippedRestore">
                    <h1>Ready to rock n' roll!</h1>
                    
                    <p>Click below to open the backoffice</p>
                    
                        
                    <div class="cta" ng-if="ready">
                        <a href="<%= IOHelper.ResolveUrl(SystemDirectories.Umbraco) %>" class="button">Open Umbraco</a>
                    </div>
                </li>
            </ul>


            <div ng-if="currentTask.exception" class="json">
               <pre>{{currentTask.exception | json}}</pre>
            </div>


        </div>
    </article>

</section>

<script type="text/javascript" src="/umbraco/lib/jquery/jquery.min.js"></script>
<script type="text/javascript" src="/umbraco/lib/angular/1.1.5/angular.min.js"></script>
<script type="text/javascript" src="/app_plugins/deploy/nonodes.bootstrap.js"></script>
<script type="text/javascript" src="/app_plugins/deploy/shared/services/deploy.service.js"></script>

<script type="text/javascript">
    angular.bootstrap(document, ['umbraco.nonodes']);
</script>

<% } %>



</body>
</html>
