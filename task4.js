const request=require('request');
const cheerio=require('cheerio');
const xlsx=require("xlsx");
// const fs=require("fs")
const path = require('path');
const fs=require('fs');
const directoryName = "IPL"; // Name of the directory you want to create
const directoryPath = path.join(__dirname, directoryName);
fs.mkdirSync(directoryPath);

const url="https://www.espncricinfo.com/series/ipl-2020-21-1210595";
request(url,cb);
function cb(err,resp,html) {
    if(err)
        console.log("error");
    else open_1_page(html)

}
function open_1_page(html) {
    const $=cheerio.load(html);
    const link_to_all="https://www.espncricinfo.com"+$('.ds-border-t.ds-border-line.ds-text-center.ds-py-2 a').attr('href');
    new_page_2(link_to_all)
}
function new_page_2(link_to_all) 
{
        request(link_to_all,(err,resp,html)=>{
            if(err)console.log("error");
            else 
            {
                opening_of_particular_match(html);
            } 
        })
}
function opening_of_particular_match(html) {
    const $=cheerio.load(html);
    const get_array=$('.ds-grow.ds-px-4.ds-border-r.ds-border-line-default-translucent');
    
    for(let i=0;i<get_array.length;i++)
    {
        const href="https://www.espncricinfo.com"+$(get_array[i]).find('a').attr('href');
        match_fxn(href);
    }
}
function match_fxn(href) {
    request(href,(err,resp,html)=>{
        if(err)console.log("error");
        else 
        {
            open_match(html);
        }
    })
}
function open_match(html) {
    const $=cheerio.load(html);
    const team_names=$('.ds-text-title-xs.ds-font-bold.ds-capitalize');
    let winning_team=$('.ds-text-tight-m.ds-font-regular.ds-truncate.ds-text-typo').text();

    winning_team=winning_team.split("won");
    winning_team=winning_team[0];

    let venue_and_date=$('.ds-text-tight-m.ds-font-regular.ds-text-typo-mid3').text();
    venue_and_date=venue_and_date.split(",");
    const venue=venue_and_date[1];
    const date=venue_and_date[2]+","+venue_and_date[3];
    

    // now teams data
    const team_data=$('.ds-w-full.ds-table.ds-table-md.ds-table-auto.ci-scorecard-table');
    // console.log(team_data.length);
    for(let i=0;i<team_data.length;i++)
    {
        let opponent_team=i==0?$(team_names[1]).text():$(team_names[0]).text();
        let team_name=$(team_names[i]).text();
        let team_body=$(team_data[i]).find('tbody');
        let team_rows=$(team_body).find('tr');
        for(let j=0;j<team_rows.length;j++)
        {
            let table_data=$(team_rows[j]).find('td');
            let containsAnchorTag = $(table_data[0]).find('a').length > 0;
            if(containsAnchorTag && table_data.length>=8)
            {
                let player_name=$(table_data[0]).text();
                let player_runs=$(table_data[2]).text();
                let fours=$(table_data[5]).text();
                let sixes=$(table_data[6]).text();
                let strike_rate=$(table_data[7]).text();
                // console.log(player_name+"  |"+player_runs+"  |"+fours+"  |"+sixes+"  |"+strike_rate+"  |"+team_name+"  |"+opponent_team+"  |"+venue);

                
                function excel_writer(json,sheet_name,file_path) {
                    let newbook=xlsx.utils.book_new()
                    let new_work_sheet=xlsx.utils.json_to_sheet(json)
                    xlsx.utils.book_append_sheet(newbook,new_work_sheet,sheet_name)
                    xlsx.writeFile(newbook,file_path)
                    }
                function excel_read(sheetname,file_path) {
                    if(fs.existsSync(file_path)==false)return [];
                const wb=xlsx.readFile(file_path )
                const excelData = wb.Sheets[sheetname];
                const ans = xlsx.utils.sheet_to_json(excelData);
                return ans;
                }
                let teampath=path.join(directoryPath,team_name)
                if(fs.existsSync(teampath)==false)
                {
                    fs.mkdirSync(teampath)
                }
                let player_xlsx=path.join(teampath,player_name+".xlsx")
                    let content=excel_read("sheet-1" ,player_xlsx)
                    let player_obj={
                        player_name,
                        player_runs,
                        fours,
                        sixes,
                        strike_rate,
                        team_name,
                        opponent_team,
                        venue
                    }
                    content.push(player_obj)
                    excel_writer(content,player_name,player_xlsx)
            }
        }
    }
}