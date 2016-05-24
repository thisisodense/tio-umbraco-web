<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="install.ascx.cs" Inherits="Yoyocms.Umbraco7.TagManager.UserControls.TagManager.install" %>

<asp:Literal ID="testoutput" runat="server" />
<asp:Panel runat="server" ID="done" Visible="false">
    <p>
        <strong>Installation complete!</strong>
    </p>
    <p>
        All components are now installed.</p>
    <p>
        You will need to log out and back in to see the changes.</p>
        <p>You may even have to "touch" the web.config file to force the umbracoApp / umbracoAppTree table changes to be
        loaded.</p>
</asp:Panel>
<asp:Panel runat="server" ID="error" Visible="false">
    <p>
        <strong>Oops - something went wrong!</strong>
    </p>
    <p>
        There was an error when processing the database updates and umbraco/config/create/ui.xml
        changes.</p>
    <p>
        The changes that being made were:</p>
   

    <h2>/umbraco/config/lang/en.xml</h2>

    <p>Add the following within the &lt;area alias="sections"&gt;</p>

    <p>
    &lt;key alias="tagMaint"&gt;Tag Maintenance&lt;/key&gt;</p>

    <p>Please manually add the above to the en.xml file.</p>

   
</asp:Panel>
